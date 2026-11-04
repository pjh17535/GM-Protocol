// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GMPartner} from "../GMPartner.sol";
import {MockERC20}      from "../test-helpers/MockERC20.sol";
import {MockGMCheckIn}  from "../test-helpers/MockGMCheckIn.sol";
import {MockGMBuyback}  from "../test-helpers/MockGMBuyback.sol";
import {MockGMMainPool} from "../test-helpers/MockGMMainPool.sol";

/// @dev Shared fixtures for every GMPartner test category.
abstract contract GMPartnerTestBase is Test {

    // ── Constants ─────────────────────────────────────────────────────────
    address internal constant USDC_ADDR = 0x3600000000000000000000000000000000000000;

    uint256 internal constant MIN_INJECT   = 10e6;   // testnet minimum (10 USDC)
    uint256 internal constant CHECKIN_FEE  = 100_000; // 0.1 USDC (6 dec)
    uint256 internal constant BPS_DENOM    = 10_000;
    uint256 internal constant REWARD_BPS   = 8_000;
    uint256 internal constant MAIN_BPS     = 1_000;
    uint256 internal constant BUYBACK_BPS  = 1_000;

    uint256 internal constant START_TS  = 1_000 * 86_400; // day 1000
    uint256 internal constant DAY       = 86_400;

    // ── Milestone config for 2-milestone "GM Protocol test" project ───────
    uint8    internal constant MILESTONE_COUNT = 2;
    uint256  internal constant MILESTONE_0     = 7;   // tier 0 = 7 days
    uint256  internal constant MILESTONE_1     = 14;  // tier 1 = 14 days

    // milestoneReleaseBps from contract: [150, 1000, 1500, 1800]
    uint256  internal constant RELEASE_BPS_0   = 150;
    uint256  internal constant RELEASE_BPS_1   = 1_000;

    // ── Actors ────────────────────────────────────────────────────────────
    address internal owner    = makeAddr("owner");
    address internal operator = makeAddr("operator");
    address internal alice    = makeAddr("alice");
    address internal bob      = makeAddr("bob");

    // ── Contracts ─────────────────────────────────────────────────────────
    MockERC20      internal usdc;
    MockGMCheckIn  internal mockCheckin;
    MockGMBuyback  internal mockBuyback;
    MockGMMainPool internal mockMainPool;
    GMPartner      internal partner;

    function setUp() public virtual {
        vm.warp(START_TS);

        // 1. Etch USDC mock at the canonical address.
        MockERC20 usdcImpl = new MockERC20("Mock USDC", "mUSDC", 6);
        vm.etch(USDC_ADDR, address(usdcImpl).code);
        usdc = MockERC20(USDC_ADDR);

        // 2. Deploy protocol mocks.
        mockCheckin  = new MockGMCheckIn();
        mockBuyback  = new MockGMBuyback();
        mockMainPool = new MockGMMainPool(USDC_ADDR);

        // 3. Deploy GMPartner under test.
        uint256[4] memory mDays;
        mDays[0] = MILESTONE_0;
        mDays[1] = MILESTONE_1;
        // mDays[2] and [3] are 0 (unused — only 2 milestones)

        partner = new GMPartner(
            owner,
            operator,
            address(mockCheckin),
            address(mockBuyback),
            address(mockMainPool),
            "GM Protocol test",
            "https://gmprotocol.com",
            MILESTONE_COUNT,
            mDays,
            true // isTestnet
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /// Mint USDC to `user` and approve the partner contract to spend it.
    function _fund(address user, uint256 amount) internal {
        usdc.mint(user, amount);
        vm.prank(user);
        usdc.approve(address(partner), amount);
    }

    /// Inject enough USDC to activate the contract (from alice).
    function _activate() internal {
        _fund(alice, MIN_INJECT);
        vm.prank(alice);
        partner.injectFunds(MIN_INJECT);
    }

    /// Perform one partner check-in as `user`.
    function _checkin(address user) internal {
        _fund(user, CHECKIN_FEE);
        vm.prank(user);
        partner.checkin();
    }

    /// Build a consecutive streak of `numDays` for `user` starting from
    /// the current block.timestamp.
    function _buildStreak(address user, uint256 numDays) internal {
        for (uint256 i = 0; i < numDays; i++) {
            if (i > 0) vm.warp(block.timestamp + DAY);
            _checkin(user);
        }
    }

    /// Split an amount using the 80/10/10 formula that the contract uses.
    function _split(uint256 amount)
        internal
        pure
        returns (uint256 rewardShare, uint256 mainShare, uint256 buybackShare)
    {
        rewardShare  = (amount * REWARD_BPS)  / BPS_DENOM;
        mainShare    = (amount * MAIN_BPS)    / BPS_DENOM;
        buybackShare = (amount * BUYBACK_BPS) / BPS_DENOM;
        uint256 dust = amount - rewardShare - mainShare - buybackShare;
        rewardShare += dust;
    }
}
