// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GMCheckIn} from "../GMCheckIn.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";
import {MockGMPool} from "../test-helpers/MockGMPool.sol";
import {MockGMBuyback} from "../test-helpers/MockGMBuyback.sol";

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

        // 4. Deploy contract under test.
        gm = new GMCheckIn(owner, address(gmPool), address(gmBuyback));
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

    function _executeSnapshot(uint256 dayIndex) internal {
        gm.executeSnapshot(dayIndex);
    }

    function _claimMilestone(address user, uint8 tier) internal {
        vm.prank(user);
        gm.claimMilestone(tier);
    }
}
