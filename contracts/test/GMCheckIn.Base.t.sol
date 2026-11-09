// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GMCheckIn} from "../GMCheckIn.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";
import {MockGMPool} from "../test-helpers/MockGMPool.sol";
import {MockGMBuyback} from "../test-helpers/MockGMBuyback.sol";
import {MockUniswapV2Pair} from "../test-helpers/MockUniswapV2Pair.sol";

/// @dev Shared fixtures for every GMCheckIn v3 test category.
abstract contract GMCheckInTestBase is Test {
    // ── Canonical token addresses (constants in the contract) ─────────────
    address internal constant USDC_ADDR = 0x3600000000000000000000000000000000000000;
    address internal constant GARC_ADDR = 0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc;

    // ── Tier indices ──────────────────────────────────────────────────────
    uint8 internal constant BRONZE   = 0;
    uint8 internal constant GOLD     = 1;
    uint8 internal constant PLATINUM = 2;
    uint8 internal constant LEGEND   = 3;

    // ── Milestone config (mirrors contract) ───────────────────────────────
    uint256 internal constant BRONZE_DAYS   = 30;
    uint256 internal constant GOLD_DAYS     = 90;
    uint256 internal constant PLATINUM_DAYS = 180;
    uint256 internal constant LEGEND_DAYS   = 365;

    uint256 internal constant BRONZE_BPS   = 150;
    uint256 internal constant GOLD_BPS     = 1_000;
    uint256 internal constant PLATINUM_BPS = 1_500;
    uint256 internal constant LEGEND_BPS   = 1_800;

    // Buyback ratio constants (mirrors contract private consts)
    uint256 internal constant BUYBACK_USER_PARTS  = 8;
    uint256 internal constant BUYBACK_TOTAL_PARTS = 9;

    uint8 internal constant POOL_REWARD = 0;

    // ── LP pair fixture: 1 USDC (1e6) == 2_000 gARC (2_000e18) ─────────────
    uint112 internal constant RES_USDC = 1_000_000e6;               // 1e12
    uint112 internal constant RES_GARC = 2_000_000_000e18;          // 2e27
    /// gARC base units per 1 USDC base unit at the fixture price.
    uint256 internal constant GARC_PER_USDC_UNIT = 2e15;

    // ── Fee ───────────────────────────────────────────────────────────────
    uint256 internal constant FEE = 100_000; // 0.1 USDC (6 decimals)

    // ── Baseline timestamp (day 1 000) ────────────────────────────────────
    uint256 internal constant START_DAY = 1_000;
    uint256 internal constant START_TS  = START_DAY * 86_400;

    // ── Actors ────────────────────────────────────────────────────────────
    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob   = makeAddr("bob");

    // ── Contracts ─────────────────────────────────────────────────────────
    MockERC20     internal usdc;
    MockERC20     internal garc;
    MockGMPool    internal gmPool;
    MockGMBuyback internal gmBuyback;
    MockUniswapV2Pair internal pair;
    GMCheckIn     internal gm;

    function setUp() public virtual {
        vm.warp(START_TS);

        // 1. Etch USDC mock at the canonical address.
        MockERC20 usdcImpl = new MockERC20("Mock USDC", "mUSDC", 6);
        vm.etch(USDC_ADDR, address(usdcImpl).code);
        usdc = MockERC20(USDC_ADDR);

        // 2. Etch gARC mock at the canonical address.
        MockERC20 garcImpl = new MockERC20("Mock gARC", "mGARC", 18);
        vm.etch(GARC_ADDR, address(garcImpl).code);
        garc = MockERC20(GARC_ADDR);

        // 3. Deploy mocks for GMPool and GMBuyback.
        gmPool    = new MockGMPool(USDC_ADDR, GARC_ADDR);
        gmBuyback = new MockGMBuyback();
        gmBuyback.setUsdc(USDC_ADDR);

        // 3b. LP pair (USDC = token0) used by gArcForUsdc.
        pair = new MockUniswapV2Pair(USDC_ADDR, GARC_ADDR, RES_USDC, RES_GARC);

        // 4. Deploy contract under test.
        gm = new GMCheckIn(owner, address(gmPool), address(gmBuyback), address(pair));
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /// Fund `user` with USDC and approve the contract to spend it.
    function _fundAndApprove(address user, uint256 amount) internal {
        usdc.mint(user, amount);
        vm.prank(user);
        usdc.approve(address(gm), amount);
    }

    /// Perform one check-in as `user` (mints fee + approves first).
    function _checkin(address user) internal {
        _fundAndApprove(user, FEE);
        vm.prank(user);
        gm.checkin();
    }

    /// Advance one UTC day then check in.
    function _checkinNextDay(address user) internal {
        vm.warp(block.timestamp + 86_400);
        _checkin(user);
    }

    /// Build a streak of `numDays` consecutive check-ins for `user`.
    function _buildStreak(address user, uint256 numDays) internal {
        for (uint256 i = 0; i < numDays; i++) {
            if (i > 0) vm.warp(block.timestamp + 86_400);
            _checkin(user);
        }
    }

    /// Compute the total USDC the pool must release for a given claimUsdc.
    /// Formula: usdcToPull = (claimUsdc * TOTAL_PARTS + USER_PARTS - 1) / USER_PARTS
    function _usdcToPull(uint256 claimUsdc) internal pure returns (uint256) {
        return (claimUsdc * BUYBACK_TOTAL_PARTS + BUYBACK_USER_PARTS - 1) / BUYBACK_USER_PARTS;
    }

    /// Compute the expected claimUsdc for a given pool balance and tier bps.
    function _expectedClaimUsdc(uint256 poolBal, uint256 bps) internal pure returns (uint256) {
        return (poolBal * bps) / 10_000;
    }

    /// Queue + execute + claim helpers for a single tier.
    function _queueMilestone(address user, uint8 tier) internal {
        vm.prank(user);
        gm.queueMilestoneClaim(tier);
    }

    /// Warp to the first second of the day after `dayIndex` so the day is closed.
    function _closeDay(uint256 dayIndex) internal {
        vm.warp((dayIndex + 1) * 86_400);
    }

    /// Close `dayIndex` then execute its snapshot.
    function _executeSnapshot(uint256 dayIndex) internal {
        _closeDay(dayIndex);
        gm.executeSnapshot(dayIndex);
    }

    /// Expected gARC for a USDC amount at the fixture price (independent of the contract).
    function _gArcFor(uint256 usdcAmount) internal pure returns (uint256) {
        return usdcAmount * GARC_PER_USDC_UNIT;
    }

    function _claimMilestone(address user, uint8 tier) internal {
        vm.prank(user);
        gm.claimMilestone(tier);
    }
}
