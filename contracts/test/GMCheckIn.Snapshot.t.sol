// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMCheckInTestBase} from "./GMCheckIn.Base.t.sol";
import {GMCheckIn} from "../GMCheckIn.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @dev executeSnapshot (closed-day gate, pause, fail-closed buyback), global
///      outstandingReservedUsdc, renounce guard. Uses MockGMBuyback.
contract GMCheckInSnapshotTest is GMCheckInTestBase {
    uint256 internal constant DAY_S = 86_400;

    function _queueAlice(uint256 poolBal) internal returns (uint256 day, uint256 pull) {
        gmPool.setPoolBalance(POOL_REWARD, poolBal);
        _buildStreak(alice, BRONZE_DAYS);
        _queueMilestone(alice, BRONZE);
        day = gm.pendingClaimDay(alice, BRONZE);
        pull = gm.snapshotTotalClaimUsdc(day);
    }

    /// alice reaches a 30-day streak and queues on day D0; bob reaches 30 on D0+1 (not yet queued).
    /// Returns with block.timestamp on D1 = D0 + 1.
    function _aliceQueuedD0_bobReadyD1(uint256 poolBal) internal returns (uint256 d0, uint256 d1) {
        gmPool.setPoolBalance(POOL_REWARD, poolBal);
        for (uint256 i = 0; i <= BRONZE_DAYS; i++) {
            vm.warp(START_TS + i * DAY_S);
            if (i < BRONZE_DAYS) _checkin(alice);
            if (i >= 1) _checkin(bob);
            if (i == BRONZE_DAYS - 1) _queueMilestone(alice, BRONZE);
        }
        d0 = gm.pendingClaimDay(alice, BRONZE);
        d1 = block.timestamp / DAY_S;
        assertEq(d1, d0 + 1);
    }

    // ── closed-day gate ───────────────────────────────────────────────────

    function test_Snapshot_RevertsDayNotClosed_OnOpenDay() public {
        (uint256 day,) = _queueAlice(2_000_000e6);
        vm.expectRevert(abi.encodeWithSelector(GMCheckIn.DayNotClosed.selector, day));
        gm.executeSnapshot(day);
        assertFalse(gm.snapshotExecuted(day));
        assertEq(gmBuyback.buybackAndBurnCallCount(), 0);
    }

    function test_Snapshot_RevertsDayNotClosed_AtLastSecondOfDay() public {
        (uint256 day,) = _queueAlice(2_000_000e6);
        vm.warp((day + 1) * DAY_S - 1);
        vm.expectRevert(abi.encodeWithSelector(GMCheckIn.DayNotClosed.selector, day));
        gm.executeSnapshot(day);
    }

    function test_Snapshot_SucceedsAtFirstSecondOfNextDay() public {
        (uint256 day,) = _queueAlice(2_000_000e6);
        vm.warp((day + 1) * DAY_S);
        gm.executeSnapshot(day);
        assertTrue(gm.snapshotExecuted(day));
    }

    function test_Snapshot_OpenDayRevertDoesNotWithdrawFromPool() public {
        (uint256 day,) = _queueAlice(2_000_000e6);
        uint256 supplyBefore = usdc.totalSupply();
        vm.expectRevert(abi.encodeWithSelector(GMCheckIn.DayNotClosed.selector, day));
        gm.executeSnapshot(day);
        assertEq(usdc.totalSupply(), supplyBefore, "pool mock mints on withdraw; none happened");
    }

    function test_Snapshot_IsPermissionless() public {
        (uint256 day,) = _queueAlice(2_000_000e6);
        _closeDay(day);
        vm.prank(makeAddr("randomKeeper"));
        gm.executeSnapshot(day);
        assertTrue(gm.snapshotExecuted(day));
    }

    // ── pause ─────────────────────────────────────────────────────────────

    function test_Snapshot_RevertsWhenPaused() public {
        (uint256 day,) = _queueAlice(2_000_000e6);
        _closeDay(day);
        vm.prank(owner);
        gm.pause();
        vm.expectRevert(Pausable.EnforcedPause.selector);
        gm.executeSnapshot(day);
        assertFalse(gm.snapshotExecuted(day));

        vm.prank(owner);
        gm.unpause();
        gm.executeSnapshot(day);
        assertTrue(gm.snapshotExecuted(day));
    }

    // ── buyback & burn wiring / fail closed ───────────────────────────────

    function test_Snapshot_BuysBackExactlyTotalUsdcOnce() public {
        (uint256 day, uint256 pull) = _queueAlice(2_000_000e6);
        _executeSnapshot(day);
        assertEq(gmBuyback.buybackAndBurnCallCount(), 1);
        assertEq(gmBuyback.lastBuybackAmount(), pull);
        assertEq(gmBuyback.totalPulled(), pull);
        assertEq(usdc.balanceOf(address(gm)), 0);
        // Burn amount is the 9/8 gross-up: pull >= claim * 9/8
        uint256 claim = gm.pendingClaimUsdc(alice, BRONZE);
        assertEq(pull, (claim * 9 + 7) / 8);
    }

    function test_Snapshot_EmitsSnapshotBuybackAndSnapshotExecuted() public {
        (uint256 day, uint256 pull) = _queueAlice(2_000_000e6);
        gmBuyback.setGarcBurnedPerCall(777e18);
        _closeDay(day);
        vm.expectEmit(true, false, false, true, address(gm));
        emit GMCheckIn.SnapshotBuyback(day, pull, 777e18);
        vm.expectEmit(true, false, false, true, address(gm));
        emit GMCheckIn.SnapshotExecuted(day, pull, block.timestamp);
        gm.executeSnapshot(day);
    }

    function test_Snapshot_FailsClosedWhenBuybackReverts() public {
        (uint256 day, uint256 pull) = _queueAlice(2_000_000e6);
        _closeDay(day);
        gmBuyback.setShouldRevert(true);

        uint256 supplyBefore = usdc.totalSupply();
        uint256 outstandingBefore = gm.outstandingReservedUsdc();

        vm.expectRevert("MockGMBuyback: revert");
        gm.executeSnapshot(day);

        assertFalse(gm.snapshotExecuted(day), "not marked executed");
        assertEq(gm.outstandingReservedUsdc(), outstandingBefore, "reservation kept");
        assertEq(gm.outstandingReservedUsdc(), pull);
        assertEq(usdc.totalSupply(), supplyBefore, "withdrawal rolled back");
        assertEq(usdc.balanceOf(address(gm)), 0);
        assertEq(usdc.allowance(address(gm), address(gmBuyback)), 0);

        // user cannot claim while the snapshot is not executed
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(GMCheckIn.SnapshotNotExecuted.selector, day));
        gm.claimMilestone(BRONZE);

        // retry succeeds once the buyback recovers
        gmBuyback.setShouldRevert(false);
        gm.executeSnapshot(day);
        assertTrue(gm.snapshotExecuted(day));
    }

    function test_Snapshot_FailsClosedWhenBuybackCannotPullUsdc() public {
        // Replace buyback with an address that has no code: the high-level call reverts.
        (uint256 day,) = _queueAlice(2_000_000e6);
        _closeDay(day);
        vm.prank(owner);
        gm.setGMBuyback(makeAddr("noCodeBuyback"));
        uint256 supplyBefore = usdc.totalSupply();
        vm.expectRevert();
        gm.executeSnapshot(day);
        assertFalse(gm.snapshotExecuted(day));
        assertEq(usdc.totalSupply(), supplyBefore);
    }

    // ── global outstanding reservation ────────────────────────────────────

    function test_Queue_IncrementsOutstandingReserved() public {
        assertEq(gm.outstandingReservedUsdc(), 0);
        (, uint256 pull) = _queueAlice(2_000_000e6);
        assertEq(gm.outstandingReservedUsdc(), pull);
    }

    function test_Snapshot_ReleasesOutstandingReserved() public {
        (uint256 day,) = _queueAlice(2_000_000e6);
        _executeSnapshot(day);
        assertEq(gm.outstandingReservedUsdc(), 0);
    }

    function test_Claim_DoesNotTouchOutstandingReserved() public {
        (uint256 day,) = _queueAlice(2_000_000e6);
        _executeSnapshot(day);
        _claimMilestone(alice, BRONZE);
        assertEq(gm.outstandingReservedUsdc(), 0);
    }

    function test_Queue_GlobalReservationPreventsOverReservingAcrossDays() public {
        uint256 P = 1_000_000e6;
        (uint256 d0, uint256 d1) = _aliceQueuedD0_bobReadyD1(P);
        uint256 reservedA = gm.outstandingReservedUsdc();
        assertEq(gm.snapshotReservedUsdc(d0), reservedA);
        assertEq(gm.snapshotReservedUsdc(d1), 0, "per-day counter for D1 is empty");

        // Pool balance leaves only 1000 base units unreserved after alice's pending reservation.
        uint256 newPool = reservedA + 1000;
        gmPool.setPoolBalance(POOL_REWARD, newPool);
        uint256 claimB = (newPool * BRONZE_BPS) / 10_000;
        uint256 pullB = _usdcToPull(claimB);
        assertGt(pullB, 1000);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(GMCheckIn.InsufficientRewardPool.selector, pullB, uint256(1000)));
        gm.queueMilestoneClaim(BRONZE);
        assertEq(gm.outstandingReservedUsdc(), reservedA, "failed queue reserved nothing");
    }

    function test_Queue_ReservationFreedAfterSnapshotAllowsQueue() public {
        uint256 P = 1_000_000e6;
        (uint256 d0,) = _aliceQueuedD0_bobReadyD1(P);
        uint256 reservedA = gm.outstandingReservedUsdc();
        uint256 newPool = reservedA + 1000;
        gmPool.setPoolBalance(POOL_REWARD, newPool);

        vm.prank(bob);
        vm.expectRevert();
        gm.queueMilestoneClaim(BRONZE);

        // D0 is closed (we are on D1): snapshot releases alice's reservation.
        gm.executeSnapshot(d0);
        assertEq(gm.outstandingReservedUsdc(), 0);

        // With the reservation released, the same pool balance now has room for bob.
        _queueMilestone(bob, BRONZE);
        assertGt(gm.pendingClaimDay(bob, BRONZE), 0);
    }

    function test_Queue_OutstandingAccumulatesAcrossDays_AndReleasesPerDay() public {
        (uint256 d0, uint256 d1) = _aliceQueuedD0_bobReadyD1(1_000_000e6);
        uint256 reservedA = gm.outstandingReservedUsdc();
        _queueMilestone(bob, BRONZE);
        uint256 reservedB = gm.snapshotTotalClaimUsdc(d1);
        assertGt(reservedB, 0);
        assertEq(gm.outstandingReservedUsdc(), reservedA + reservedB);

        gm.executeSnapshot(d0);
        assertEq(gm.outstandingReservedUsdc(), reservedB, "only D0 released");

        _executeSnapshot(d1);
        assertEq(gm.outstandingReservedUsdc(), 0);
    }

    function test_Queue_TwoUsersSameDay_AccumulateOutstanding() public {
        gmPool.setPoolBalance(POOL_REWARD, 1_000_000e6);
        for (uint256 i = 0; i < BRONZE_DAYS; i++) {
            if (i > 0) vm.warp(block.timestamp + DAY_S);
            _checkin(alice);
            _checkin(bob);
        }
        _queueMilestone(alice, BRONZE);
        uint256 afterA = gm.outstandingReservedUsdc();
        _queueMilestone(bob, BRONZE);
        uint256 day = gm.pendingClaimDay(alice, BRONZE);
        assertEq(gm.outstandingReservedUsdc(), gm.snapshotTotalClaimUsdc(day));
        assertEq(gm.outstandingReservedUsdc(), 2 * afterA);
    }

    // ── renounceOwnership ─────────────────────────────────────────────────

    function test_RenounceOwnership_AlwaysRevertsForOwner_NotPaused() public {
        vm.prank(owner);
        vm.expectRevert(GMCheckIn.RenounceDisabled.selector);
        gm.renounceOwnership();
        assertEq(gm.owner(), owner);
    }

    function test_RenounceOwnership_AlwaysRevertsForOwner_Paused() public {
        vm.startPrank(owner);
        gm.pause();
        vm.expectRevert(GMCheckIn.RenounceDisabled.selector);
        gm.renounceOwnership();
        vm.stopPrank();
        assertEq(gm.owner(), owner);
    }

    function test_RenounceOwnership_NonOwnerRevertsViaOnlyOwnerFirst() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        gm.renounceOwnership();
    }

    // ── Ownable2Step ──────────────────────────────────────────────────────

    function test_TransferOwnership_OnlySetsPendingOwner() public {
        vm.expectEmit(true, true, false, false, address(gm));
        emit Ownable2Step.OwnershipTransferStarted(owner, alice);
        vm.prank(owner);
        gm.transferOwnership(alice);
        assertEq(gm.owner(), owner, "owner unchanged");
        assertEq(gm.pendingOwner(), alice);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        gm.pause();
    }

    function test_TransferOwnership_NonOwnerReverts() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        gm.transferOwnership(alice);
    }

    function test_AcceptOwnership_ByPendingOwnerCompletesTransfer() public {
        vm.prank(owner);
        gm.transferOwnership(alice);

        vm.expectEmit(true, true, false, false, address(gm));
        emit Ownable.OwnershipTransferred(owner, alice);
        vm.prank(alice);
        gm.acceptOwnership();

        assertEq(gm.owner(), alice);
        assertEq(gm.pendingOwner(), address(0));

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, owner));
        gm.pause();
        vm.prank(alice);
        gm.pause();
        assertTrue(gm.paused());
    }

    function test_AcceptOwnership_ByNonPendingReverts() public {
        vm.prank(owner);
        gm.transferOwnership(alice);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, bob));
        gm.acceptOwnership();
        assertEq(gm.owner(), owner);
    }
}
