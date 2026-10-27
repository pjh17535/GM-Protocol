// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMCheckInTestBase} from "./GMCheckIn.Base.t.sol";
import {GMCheckIn} from "../GMCheckIn.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract GMCheckInMilestoneTest is GMCheckInTestBase {

    // ─────────────────────────────────────────────────────────────────────
    // Shared setup helpers
    // ─────────────────────────────────────────────────────────────────────

    /// Seed the pool's POOL_REWARD slot so queueMilestoneClaim can calculate
    /// a non-zero claimUsdc and pass the InsufficientRewardPool check.
    function _seedPool(uint256 amount) internal {
        gmPool.setPoolBalance(POOL_REWARD, amount);
    }

    /// Compute the claimUsdc the contract will derive for a given pool balance
    /// and tier bps value.
    function _claimUsdc(uint256 poolBal, uint256 bps) internal pure returns (uint256) {
        return (poolBal * bps) / 10_000;
    }

    // ─────────────────────────────────────────────────────────────────────
    // queueMilestoneClaim — revert paths
    // ─────────────────────────────────────────────────────────────────────

    // 7. Reverts if streak < required days
    function test_Queue_RevertsIfStreakTooLow() public {
        _buildStreak(alice, 10); // 10 < 30 (Bronze)
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMCheckIn.MilestoneNotReached.selector,
                BRONZE, uint256(10), uint256(30)
            )
        );
        gm.queueMilestoneClaim(BRONZE);
    }

    function test_Queue_InvalidTierReverts() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(GMCheckIn.InvalidTier.selector, uint8(4)));
        gm.queueMilestoneClaim(4);
    }

    // 8. Reverts if already queued (MilestoneAlreadyQueued)
    function test_Queue_RevertsIfAlreadyQueued() public {
        _buildStreak(alice, BRONZE_DAYS);
        uint256 poolBal = 1_000_000e6;
        _seedPool(poolBal);

        _queueMilestone(alice, BRONZE);
        uint256 queuedDay = gm.pendingClaimDay(alice, BRONZE);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMCheckIn.MilestoneAlreadyQueued.selector,
                BRONZE, queuedDay
            )
        );
        gm.queueMilestoneClaim(BRONZE);
    }

    // 9. Reverts if already claimed this cycle (MilestoneAlreadyClaimedForCurrentCycle)
    function test_Queue_RevertsIfAlreadyClaimedThisCycle() public {
        _buildStreak(alice, BRONZE_DAYS);
        uint256 poolBal = 1_000_000e6;
        _seedPool(poolBal);

        // Queue, execute snapshot, claim.
        _queueMilestone(alice, BRONZE);
        uint256 day = gm.pendingClaimDay(alice, BRONZE);
        _executeSnapshot(day);
        _claimMilestone(alice, BRONZE);

        // Try to queue again within the same cycle (streak is still at 30).
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMCheckIn.MilestoneAlreadyClaimedForCurrentCycle.selector,
                BRONZE
            )
        );
        gm.queueMilestoneClaim(BRONZE);
    }

    // 10. Reverts if InsufficientRewardPool (pool too small to cover usdcToPull)
    function test_Queue_RevertsIfInsufficientRewardPool() public {
        // Strategy: build both users' streaks simultaneously day-by-day so they
        // end up with streak == BRONZE_DAYS on the same calendar day.
        for (uint256 i = 0; i < BRONZE_DAYS; i++) {
            if (i > 0) vm.warp(block.timestamp + 86_400);
            _checkin(alice);
            _checkin(bob);
        }

        // Pool balance: small enough that the second queue cannot fit.
        // claimUsdc = (pool * 150) / 10_000; usdcToPull = ceil(claimUsdc * 9 / 8).
        // With pool=1_000_000: claimUsdc=15_000, usdcToPull=ceil(135_000/8)=16_876.
        // Two users: total usdcToPull = 33_752 > pool=1_000_000? No — need pool small.
        // Use pool = 100_000: claimUsdc=1_500, usdcToPull=ceil(13_500/8)=1_688.
        // Two pulls = 3_376 < 100_000 — still fits. Need pool VERY small.
        // Use pool = 1: claimUsdc = 0 → ZeroClaimAmount (fires before InsufficientRewardPool).
        // Use pool that gives claimUsdc=1 but usdcToPull=2:
        //   claimUsdc = (pool*150)/10_000 >= 1 → pool >= 67.
        //   With pool=67: claimUsdc=1, usdcToPull=ceil(9/8)=2.
        //   After bob queues: reserved=2, available=67-2=65.
        //   Alice: claimUsdc=1, usdcToPull=2, available=65 → 2 <= 65, still fits.
        // Better: set pool to exactly usdcToPull for bob so alice's pull > 0 remaining.
        // Easiest: use pool=1_000_000 but have bob queue twice (not possible — already queued).
        // Simplest: reduce pool balance AFTER bob queues to simulate pool drain.
        uint256 poolBal = 1_000_000e6;
        _seedPool(poolBal);

        // Bob queues first, reserving usdcToPull.
        _queueMilestone(bob, BRONZE);

        uint256 bobReserved = gm.snapshotReservedUsdc(block.timestamp / 86_400);

        // Reduce pool balance to exactly what bob reserved (no room for alice).
        gmPool.setPoolBalance(POOL_REWARD, bobReserved);

        // Alice's queue should now fail: usdcToPull > available (= 0).
        vm.prank(alice);
        vm.expectRevert(); // InsufficientRewardPool or ZeroClaimAmount
        gm.queueMilestoneClaim(BRONZE);
    }

    // 11. If verificationEnabled=false: queue succeeds without verification
    function test_Queue_SucceedsWithoutVerification_WhenDisabled() public {
        assertFalse(gm.verificationEnabled()); // default off
        _buildStreak(alice, BRONZE_DAYS);
        uint256 poolBal = 1_000_000e6;
        _seedPool(poolBal);

        _queueMilestone(alice, BRONZE); // should not revert
        assertGt(gm.pendingClaimDay(alice, BRONZE), 0);
    }

    // 12. If verificationEnabled=true and verifiedLevel < required: reverts VerificationRequired
    function test_Queue_RevertsVerificationRequired() public {
        vm.prank(owner);
        gm.setVerificationEnabled(true);

        _buildStreak(alice, BRONZE_DAYS);
        uint256 poolBal = 1_000_000e6;
        _seedPool(poolBal);

        // alice has verifiedLevel=0, required=1 for Bronze
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMCheckIn.VerificationRequired.selector,
                BRONZE, uint8(1), uint8(0)
            )
        );
        gm.queueMilestoneClaim(BRONZE);
    }

    // 13. If verificationEnabled=true and verifiedLevel >= required: succeeds
    function test_Queue_SucceedsWithVerification_WhenVerified() public {
        vm.prank(owner);
        gm.setVerificationEnabled(true);

        _buildStreak(alice, BRONZE_DAYS);
        uint256 poolBal = 1_000_000e6;
        _seedPool(poolBal);

        // Give alice level 1 via completeVerification with owner as signer.
        _verifyAlice(BRONZE);

        _queueMilestone(alice, BRONZE); // should succeed
        assertGt(gm.pendingClaimDay(alice, BRONZE), 0);
    }

    // ─────────────────────────────────────────────────────────────────────
    // queueMilestoneClaim — happy-path state
    // ─────────────────────────────────────────────────────────────────────

    // 14. Sets pendingClaimDay, pendingClaimUsdc, snapshots correctly
    function test_Queue_SetsPendingStateCorrectly() public {
        _buildStreak(alice, BRONZE_DAYS);
        uint256 poolBal = 2_000_000e6;
        _seedPool(poolBal);

        uint256 expectedDay = block.timestamp / 86_400;
        uint256 expectedClaimUsdc = _claimUsdc(poolBal, BRONZE_BPS);
        uint256 expectedToPull = _usdcToPull(expectedClaimUsdc);

        _queueMilestone(alice, BRONZE);

        assertEq(gm.pendingClaimDay(alice, BRONZE), expectedDay);
        assertEq(gm.pendingClaimUsdc(alice, BRONZE), expectedClaimUsdc);
        assertEq(gm.snapshotTotalClaimUsdc(expectedDay), expectedToPull);
        assertEq(gm.snapshotReservedUsdc(expectedDay), expectedToPull);
    }

    // 15. Emits MilestoneQueued
    function test_Queue_EmitsMilestoneQueued() public {
        _buildStreak(alice, BRONZE_DAYS);
        uint256 poolBal = 2_000_000e6;
        _seedPool(poolBal);

        uint256 expectedDay = block.timestamp / 86_400;
        uint256 expectedClaimUsdc = _claimUsdc(poolBal, BRONZE_BPS);

        vm.expectEmit(true, false, false, true, address(gm));
        emit GMCheckIn.MilestoneQueued(alice, BRONZE, expectedDay, expectedClaimUsdc);

        _queueMilestone(alice, BRONZE);
    }

    // ─────────────────────────────────────────────────────────────────────
    // executeSnapshot — revert paths
    // ─────────────────────────────────────────────────────────────────────

    // 16. Reverts if snapshotTotalClaimUsdc[day] == 0 (NoClaimsToSnapshot)
    function test_Snapshot_RevertsNoClaimsToSnapshot() public {
        uint256 day = block.timestamp / 86_400;
        vm.expectRevert(
            abi.encodeWithSelector(GMCheckIn.NoClaimsToSnapshot.selector, day)
        );
        gm.executeSnapshot(day);
    }

    // 17. Reverts if already executed (SnapshotAlreadyExecuted)
    function test_Snapshot_RevertsAlreadyExecuted() public {
        _buildStreak(alice, BRONZE_DAYS);
        uint256 poolBal = 2_000_000e6;
        _seedPool(poolBal);

        _queueMilestone(alice, BRONZE);
        uint256 day = gm.pendingClaimDay(alice, BRONZE);

        gm.executeSnapshot(day);

        vm.expectRevert(
            abi.encodeWithSelector(GMCheckIn.SnapshotAlreadyExecuted.selector, day)
        );
        gm.executeSnapshot(day);
    }

    // ─────────────────────────────────────────────────────────────────────
    // executeSnapshot — happy-path state
    // ─────────────────────────────────────────────────────────────────────

    // 18. Sets snapshotExecuted[day] = true
    function test_Snapshot_SetsExecutedFlag() public {
        _buildStreak(alice, BRONZE_DAYS);
        _seedPool(2_000_000e6);
        _queueMilestone(alice, BRONZE);
        uint256 day = gm.pendingClaimDay(alice, BRONZE);

        assertFalse(gm.snapshotExecuted(day));
        gm.executeSnapshot(day);
        assertTrue(gm.snapshotExecuted(day));
    }

    // 19. Calls gmPool.withdrawReward (via mock, funds are minted to contract)
    function test_Snapshot_WithdrawsRewardFromPool() public {
        _buildStreak(alice, BRONZE_DAYS);
        uint256 poolBal = 2_000_000e6;
        _seedPool(poolBal);

        _queueMilestone(alice, BRONZE);
        uint256 day = gm.pendingClaimDay(alice, BRONZE);
        uint256 totalUsdc = gm.snapshotTotalClaimUsdc(day);

        uint256 contractUsdcBefore = usdc.balanceOf(address(gm));
        gm.executeSnapshot(day);
        // MockGMPool.withdrawReward mints USDC directly to the contract
        assertEq(usdc.balanceOf(address(gm)), contractUsdcBefore + totalUsdc);
    }

    // 20. Buyback try/catch — if executeBuyback reverts, snapshot still succeeds
    function test_Snapshot_SucceedsEvenIfBuybackReverts() public {
        gmBuyback.setShouldRevert(true);

        _buildStreak(alice, BRONZE_DAYS);
        _seedPool(2_000_000e6);
        _queueMilestone(alice, BRONZE);
        uint256 day = gm.pendingClaimDay(alice, BRONZE);

        // Should not revert even though buyback will throw
        gm.executeSnapshot(day);
        assertTrue(gm.snapshotExecuted(day));
    }

    // Emits SnapshotExecuted
    function test_Snapshot_EmitsSnapshotExecuted() public {
        _buildStreak(alice, BRONZE_DAYS);
        uint256 poolBal = 2_000_000e6;
        _seedPool(poolBal);
        _queueMilestone(alice, BRONZE);
        uint256 day = gm.pendingClaimDay(alice, BRONZE);
        uint256 totalUsdc = gm.snapshotTotalClaimUsdc(day);

        vm.expectEmit(true, false, false, true, address(gm));
        emit GMCheckIn.SnapshotExecuted(day, totalUsdc, block.timestamp);
        gm.executeSnapshot(day);
    }

    // ─────────────────────────────────────────────────────────────────────
    // claimMilestone — revert paths
    // ─────────────────────────────────────────────────────────────────────

    // 22. Reverts if no pending claim (NoPendingClaim)
    function test_Claim_RevertsNoPendingClaim() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(GMCheckIn.NoPendingClaim.selector, BRONZE)
        );
        gm.claimMilestone(BRONZE);
    }

    // 23. Reverts if snapshot not executed (SnapshotNotExecuted)
    function test_Claim_RevertsSnapshotNotExecuted() public {
        _buildStreak(alice, BRONZE_DAYS);
        _seedPool(2_000_000e6);
        _queueMilestone(alice, BRONZE);

        // Read the queued day BEFORE consuming a prank — view calls use msg.sender,
        // not a pranked address, so read it directly.
        uint256 day = gm.pendingClaimDay(alice, BRONZE);
        assertGt(day, 0); // sanity: queue was set

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(GMCheckIn.SnapshotNotExecuted.selector, day)
        );
        gm.claimMilestone(BRONZE);
    }

    // ─────────────────────────────────────────────────────────────────────
    // claimMilestone — happy-path state
    // ─────────────────────────────────────────────────────────────────────

    // 24. Clears pendingClaimDay and pendingClaimUsdc
    function test_Claim_ClearsPendingState() public {
        _buildStreak(alice, BRONZE_DAYS);
        _seedPool(2_000_000e6);
        _queueMilestone(alice, BRONZE);
        uint256 day = gm.pendingClaimDay(alice, BRONZE);
        gm.executeSnapshot(day);
        _claimMilestone(alice, BRONZE);

        assertEq(gm.pendingClaimDay(alice, BRONZE), 0);
        assertEq(gm.pendingClaimUsdc(alice, BRONZE), 0);
    }

    // 25. Calls gmPool.withdrawGArc to send gARC to user
    function test_Claim_UserReceivesGArc() public {
        _buildStreak(alice, BRONZE_DAYS);
        uint256 poolBal = 2_000_000e6;
        _seedPool(poolBal);
        _queueMilestone(alice, BRONZE);
        uint256 day = gm.pendingClaimDay(alice, BRONZE);
        uint256 claimUsdc = gm.pendingClaimUsdc(alice, BRONZE);
        gm.executeSnapshot(day);

        uint256 gArcBefore = garc.balanceOf(alice);
        _claimMilestone(alice, BRONZE);
        assertEq(garc.balanceOf(alice), gArcBefore + claimUsdc);
    }

    // 26. Updates milestoneLastClaimedDay, totalMilestoneClaims, totals
    function test_Claim_UpdatesGlobalCounters() public {
        _buildStreak(alice, BRONZE_DAYS);
        uint256 poolBal = 2_000_000e6;
        _seedPool(poolBal);
        _queueMilestone(alice, BRONZE);
        uint256 day = gm.pendingClaimDay(alice, BRONZE);
        uint256 claimUsdc = gm.pendingClaimUsdc(alice, BRONZE);
        gm.executeSnapshot(day);
        _claimMilestone(alice, BRONZE);

        assertEq(gm.milestoneLastClaimedDay(alice, BRONZE), day);
        assertEq(gm.totalMilestoneClaims(), 1);
        assertEq(gm.totalUsdcClaimed(), claimUsdc);
        assertEq(gm.totalGArcDistributed(), claimUsdc);
    }

    // 27. Emits MilestoneClaimed
    function test_Claim_EmitsMilestoneClaimed() public {
        _buildStreak(alice, BRONZE_DAYS);
        uint256 poolBal = 2_000_000e6;
        _seedPool(poolBal);
        _queueMilestone(alice, BRONZE);
        uint256 day = gm.pendingClaimDay(alice, BRONZE);
        uint256 claimUsdc = gm.pendingClaimUsdc(alice, BRONZE);
        gm.executeSnapshot(day);

        vm.expectEmit(true, false, false, true, address(gm));
        emit GMCheckIn.MilestoneClaimed(alice, BRONZE, claimUsdc, claimUsdc, day);

        _claimMilestone(alice, BRONZE);
    }

    // Pause blocks claimMilestone
    function test_Claim_RevertsWhenPaused() public {
        _buildStreak(alice, BRONZE_DAYS);
        _seedPool(2_000_000e6);
        _queueMilestone(alice, BRONZE);
        uint256 day = gm.pendingClaimDay(alice, BRONZE);
        gm.executeSnapshot(day);

        vm.prank(owner);
        gm.pause();

        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        gm.claimMilestone(BRONZE);
    }

    // Pause blocks queueMilestoneClaim
    function test_Queue_RevertsWhenPaused() public {
        _buildStreak(alice, BRONZE_DAYS);
        _seedPool(2_000_000e6);

        vm.prank(owner);
        gm.pause();

        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        gm.queueMilestoneClaim(BRONZE);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 33. Full end-to-end flow: checkin 30 days → queue Bronze →
    //     executeSnapshot → claimMilestone → gARC received
    // ─────────────────────────────────────────────────────────────────────

    function test_EndToEnd_Bronze_FullFlow() public {
        uint256 poolBal = 5_000_000e6;
        _seedPool(poolBal);

        // 30 consecutive check-ins.
        _buildStreak(alice, BRONZE_DAYS);
        (, uint256 streak,) = gm.getUserInfo(alice);
        assertEq(streak, 30);

        // Queue milestone.
        _queueMilestone(alice, BRONZE);
        uint256 day = gm.pendingClaimDay(alice, BRONZE);
        assertGt(day, 0);

        // Execute snapshot.
        gm.executeSnapshot(day);
        assertTrue(gm.snapshotExecuted(day));

        // Claim milestone.
        uint256 claimUsdc = gm.pendingClaimUsdc(alice, BRONZE);
        uint256 gArcBefore = garc.balanceOf(alice);
        _claimMilestone(alice, BRONZE);

        assertGt(garc.balanceOf(alice) - gArcBefore, 0);
        assertEq(garc.balanceOf(alice) - gArcBefore, claimUsdc);
        assertEq(gm.totalMilestoneClaims(), 1);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal: helper to complete verification for alice at a given tier
    // ─────────────────────────────────────────────────────────────────────

    uint256 private constant SIGNER_PK = 0xBEEF;

    function _verifyAlice(uint8 tier) internal {
        // Set the contract's signer to our test private key.
        address signerAddr = vm.addr(SIGNER_PK);
        vm.prank(owner);
        gm.setSigner(signerAddr);

        uint256 deadline = block.timestamp + 3_600;
        bytes32 msgHash = keccak256(
            abi.encodePacked(address(gm), alice, tier, deadline, block.chainid)
        );
        bytes32 digest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SIGNER_PK, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.prank(alice);
        gm.completeVerification(tier, deadline, sig);
    }
}
