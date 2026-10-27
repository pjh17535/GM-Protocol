// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GMPool} from "../GMPool.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";

/// @dev Shared fixture for all GMPool test categories.
///      USDC is hardcoded in the contract at 0x3600…; we etch MockERC20 there.
abstract contract GMPoolTestBase is Test {
    // ── Hardcoded USDC address (mirrors GMPool source) ─────────────────────
    address internal constant USDC_ADDR = 0x3600000000000000000000000000000000000000;

    // ── Pool index constants (mirrors GMPool source) ───────────────────────
    uint8 internal constant POOL_REWARD   = 0;
    uint8 internal constant POOL_RESERVE  = 1;
    uint8 internal constant POOL_PROTOCOL = 2;
    uint8 internal constant POOL_PARTNER  = 3;

    // ── BPS constants ──────────────────────────────────────────────────────
    uint256 internal constant BPS_DENOM     = 10_000;
    uint256 internal constant REWARD_BPS    = 8_000;
    uint256 internal constant RESERVE_BPS   = 1_000;
    uint256 internal constant PROTOCOL_BPS  = 500;
    uint256 internal constant PARTNER_BPS   = 500;

    // ── A gTotal value used across quarterly tests (1 million USDC in 6 dec) ─
    uint256 internal constant G_TOTAL = 1_000_000e6;

    // ── Actors ─────────────────────────────────────────────────────────────
    address internal owner           = makeAddr("owner");
    address internal alice           = makeAddr("alice");
    address internal checkinContract = makeAddr("checkinContract");
    address internal buybackContract = makeAddr("buybackContract");

    // ── Mock handle ────────────────────────────────────────────────────────
    MockERC20 internal usdc;

    // ── Contract under test ────────────────────────────────────────────────
    GMPool internal pool;

    // ── Baseline timestamp ─────────────────────────────────────────────────
    uint256 internal constant START_TS = 1_000_000;

    function setUp() public virtual {
        vm.warp(START_TS);

        // 1. Deploy mock to a throwaway address, then etch at canonical address.
        MockERC20 usdcImpl = new MockERC20("Mock USDC", "mUSDC", 6);
        vm.etch(USDC_ADDR, address(usdcImpl).code);
        usdc = MockERC20(USDC_ADDR);

        // 2. Deploy GMPool with gTotal == 0 (set separately when needed).
        pool = new GMPool(owner, 0);

        // 3. Wire up the role addresses.
        vm.startPrank(owner);
        pool.setCheckinContract(checkinContract);
        pool.setBuybackContract(buybackContract);
        vm.stopPrank();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /// Mint `amount` USDC to `who` and approve pool to pull it.
    function _fund(address who, uint256 amount) internal {
        usdc.mint(who, amount);
        vm.prank(who);
        usdc.approve(address(pool), amount);
    }

    /// Simulate a checkin-fee receipt of `amount` USDC.
    function _doCheckin(uint256 amount) internal {
        _fund(checkinContract, amount);
        vm.prank(checkinContract);
        pool.receiveCheckinFee(amount);
    }

    /// Compute the expected split for a given amount (mirrors _splitAmount).
    function _split(uint256 amount)
        internal
        pure
        returns (uint256 reward, uint256 reserve, uint256 protocol, uint256 partner)
    {
        reward   = (amount * REWARD_BPS)   / BPS_DENOM;
        reserve  = (amount * RESERVE_BPS)  / BPS_DENOM;
        protocol = (amount * PROTOCOL_BPS) / BPS_DENOM;
        partner  = (amount * PARTNER_BPS)  / BPS_DENOM;
        uint256 dust = amount - reward - reserve - protocol - partner;
        reward += dust;
    }
}
