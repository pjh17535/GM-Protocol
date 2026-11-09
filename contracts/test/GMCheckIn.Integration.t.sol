// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMCheckInTestBase} from "./GMCheckIn.Base.t.sol";
import {GMCheckIn} from "../GMCheckIn.sol";
import {GMBuyback} from "../GMBuyback.sol";
import {MockUniswapV2Router} from "../test-helpers/MockUniswapV2Router.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @dev GMCheckIn wired to the REAL GMBuyback (router mocked at the canonical address).
contract GMCheckInIntegrationTest is GMCheckInTestBase {
    address internal constant ROUTER_ADDR = 0xE27d5D256B370604F1Ff060fB489c6A8E3F8A6D9;
    uint256 internal constant ROUTER_RATE = 2_000e18; // gARC per 1e6 USDC units (mock router)

    MockUniswapV2Router internal router;
    GMBuyback internal buyback;

    function setUp() public override {
        super.setUp();
        MockUniswapV2Router impl = new MockUniswapV2Router();
        vm.etch(ROUTER_ADDR, address(impl).code);
        router = MockUniswapV2Router(ROUTER_ADDR);

        buyback = new GMBuyback(owner);
        gm = new GMCheckIn(owner, address(gmPool), address(buyback), address(pair));
        vm.prank(owner);
        buyback.setAuthorizedCaller(address(gm), true);
    }

    function _queue(uint256 poolBal) internal returns (uint256 day, uint256 total) {
        gmPool.setPoolBalance(POOL_REWARD, poolBal);
        _buildStreak(alice, BRONZE_DAYS);
        _queueMilestone(alice, BRONZE);
        day = gm.pendingClaimDay(alice, BRONZE);
        total = gm.snapshotTotalClaimUsdc(day);
        _closeDay(day);
    }

    function test_Snapshot_BurnsExactlyTotalUsdcWorthAndLeavesNoUsdc() public {
        (uint256 day, uint256 total) = _queue(2_000_000e6);
        uint256 expectedBurn = (total * ROUTER_RATE) / 1e6;

        vm.expectEmit(true, false, false, true, address(gm));
        emit GMCheckIn.SnapshotBuyback(day, total, expectedBurn);
        gm.executeSnapshot(day);

        assertEq(buyback.totalUsdcUsed(), total, "buyback spent exactly totalUsdc");
        assertEq(buyback.totalGarcBurned(), expectedBurn, "burned exactly the swap output");
        assertEq(usdc.balanceOf(ROUTER_ADDR), total, "router received totalUsdc");
        assertEq(usdc.balanceOf(address(gm)), 0, "GMCheckIn holds no USDC");
        assertEq(usdc.balanceOf(address(buyback)), 0, "GMBuyback holds no USDC");
        assertEq(garc.balanceOf(address(buyback)), 0, "GMBuyback holds no gARC");
        assertEq(garc.totalSupply(), 0, "swapped gARC fully burned");
        assertEq(usdc.allowance(address(gm), address(buyback)), 0, "approval reset");
        assertEq(gm.outstandingReservedUsdc(), 0);
        assertEq(buyback.lastBuybackTime(), 0, "buybackAndBurn leaves cooldown untouched");
    }

    function test_Snapshot_FailsClosedWhenSwapFails() public {
        (uint256 day,) = _queue(2_000_000e6);
        router.setMode(1);
        uint256 supplyBefore = usdc.totalSupply();
        uint256 outstanding = gm.outstandingReservedUsdc();

        vm.expectRevert("MockRouter: swap failed");
        gm.executeSnapshot(day);

        assertFalse(gm.snapshotExecuted(day));
        assertEq(gm.outstandingReservedUsdc(), outstanding);
        assertEq(usdc.totalSupply(), supplyBefore, "nothing withdrawn from pool");
        assertEq(usdc.balanceOf(address(gm)), 0);
        assertEq(usdc.balanceOf(address(buyback)), 0);
        assertEq(usdc.balanceOf(ROUTER_ADDR), 0);
        assertEq(buyback.triggerCount(), 0);

        router.setMode(0);
        gm.executeSnapshot(day);
        assertTrue(gm.snapshotExecuted(day));
    }

    function test_Snapshot_FailsClosedOnZeroQuote() public {
        (uint256 day,) = _queue(2_000_000e6);
        router.setMode(2);
        vm.expectRevert(GMBuyback.InvalidSwapQuote.selector);
        gm.executeSnapshot(day);
        assertFalse(gm.snapshotExecuted(day));
    }

    function test_Snapshot_FailsClosedWhenSwapDeliversNothing() public {
        (uint256 day,) = _queue(2_000_000e6);
        router.setMode(3);
        vm.expectRevert(GMBuyback.ZeroBurnAmount.selector);
        gm.executeSnapshot(day);
        assertFalse(gm.snapshotExecuted(day));
    }

    function test_Snapshot_RevertsWhenCheckInNotAuthorizedOnBuyback() public {
        (uint256 day,) = _queue(2_000_000e6);
        vm.prank(owner);
        buyback.setAuthorizedCaller(address(gm), false);
        uint256 supplyBefore = usdc.totalSupply();
        vm.expectRevert(GMBuyback.NotAuthorized.selector);
        gm.executeSnapshot(day);
        assertFalse(gm.snapshotExecuted(day));
        assertEq(usdc.totalSupply(), supplyBefore);
    }

    function test_Snapshot_RevertsWhenBuybackPaused() public {
        (uint256 day,) = _queue(2_000_000e6);
        vm.prank(owner);
        buyback.pause();
        vm.expectRevert(Pausable.EnforcedPause.selector);
        gm.executeSnapshot(day);
        assertFalse(gm.snapshotExecuted(day));
    }

    function test_Snapshot_DoesNotConsumeBuybackOwnUsdc() public {
        // USDC previously sent by partners sits in GMBuyback; the snapshot must leave it alone.
        usdc.mint(address(buyback), 3e6);
        (uint256 day, uint256 total) = _queue(2_000_000e6);
        gm.executeSnapshot(day);
        assertEq(usdc.balanceOf(address(buyback)), 3e6);
        assertEq(buyback.totalUsdcUsed(), total);
    }

    function test_FullFlow_ClaimPaysConvertedGArcAfterBurn() public {
        (uint256 day, uint256 total) = _queue(2_000_000e6);
        uint256 claimUsdc = gm.pendingClaimUsdc(alice, BRONZE);
        gm.executeSnapshot(day);

        _claimMilestone(alice, BRONZE);
        uint256 expected = gm.gArcForUsdc(claimUsdc);
        assertEq(garc.balanceOf(alice), expected);
        assertEq(gm.totalGArcDistributed(), expected);
        assertEq(garc.balanceOf(address(gm)), 0);
        // user portion is 8/9 of what was burned (within rounding of the 9/8 gross-up)
        assertLe(claimUsdc * 9, total * 8 + 8);
    }
}
