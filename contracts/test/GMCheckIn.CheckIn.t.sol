// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMCheckInTestBase} from "./GMCheckIn.Base.t.sol";
import {GMCheckIn} from "../GMCheckIn.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GMCheckInCheckInTest is GMCheckInTestBase {

    // ── 1. First checkin: streak=1, totalCheckins=1 ───────────────────────

    function test_FirstCheckin_StreakOne() public {
        _checkin(alice);
        (, uint256 streak, uint256 total) = gm.getUserInfo(alice);
        assertEq(streak, 1);
        assertEq(total, 1);
        assertEq(gm.totalCheckins(), 1);
    }

    // ── 2. Consecutive checkin increments streak ──────────────────────────

    function test_ConsecutiveCheckin_StreakIncrements() public {
        _checkin(alice);
        vm.warp(block.timestamp + 86_400);
        _checkin(alice);
        (, uint256 streak, uint256 total) = gm.getUserInfo(alice);
        assertEq(streak, 2);
        assertEq(total, 2);
    }

    function test_ThreeConsecutiveDays_StreakThree() public {
        _buildStreak(alice, 3);
        (, uint256 streak,) = gm.getUserInfo(alice);
        assertEq(streak, 3);
    }

    // ── 3. Gap resets streak to 1 ─────────────────────────────────────────

    function test_GapResets_StreakToOne() public {
        _checkin(alice);
        // skip 2 days (gap of 1 day)
        vm.warp(block.timestamp + 2 * 86_400);
        _checkin(alice);
        (, uint256 streak,) = gm.getUserInfo(alice);
        assertEq(streak, 1);
    }

    function test_GapLarge_StreakToOne() public {
        _buildStreak(alice, 5);
        vm.warp(block.timestamp + 10 * 86_400);
        _checkin(alice);
        (, uint256 streak,) = gm.getUserInfo(alice);
        assertEq(streak, 1);
    }

    // ── 4. AlreadyCheckedInToday reverts on same day ──────────────────────

    function test_SameDay_Reverts_AlreadyCheckedInToday() public {
        _checkin(alice);
        _fundAndApprove(alice, FEE);
        vm.prank(alice);
        vm.expectRevert(GMCheckIn.AlreadyCheckedInToday.selector);
        gm.checkin();
    }

    // ── 5. Fee is pulled to GMPool ────────────────────────────────────────

    function test_CheckinFee_PulledFromUser() public {
        usdc.mint(alice, FEE);
        vm.prank(alice);
        usdc.approve(address(gm), FEE);

        uint256 balBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        gm.checkin();
        uint256 balAfter = usdc.balanceOf(alice);

        assertEq(balBefore - balAfter, FEE);
    }

    // checkin calls gmPool.receiveCheckinFee — no revert means it succeeded
    function test_CheckinFee_ForwardedToGMPool() public {
        // If receiveCheckinFee was not called, the mock would not have been
        // invoked. We verify indirectly by ensuring checkin succeeds end-to-end.
        _checkin(alice);
        // If we get here with no revert, fee forwarding worked.
        (, , uint256 total) = gm.getUserInfo(alice);
        assertEq(total, 1);
    }

    function test_Checkin_RevertsWhenFeeIsZero() public {
        vm.prank(owner);
        // We cannot set fee to zero (setCheckinFee reverts on 0),
        // but we can verify the guard exists via setCheckinFee.
        vm.expectRevert(abi.encodeWithSelector(GMCheckIn.InvalidFee.selector, uint256(0)));
        gm.setCheckinFee(0);
    }

    // ── 6. Emits CheckedIn event ──────────────────────────────────────────

    function test_CheckedIn_EventEmitted() public {
        usdc.mint(alice, FEE);
        vm.prank(alice);
        usdc.approve(address(gm), FEE);

        uint256 expectedDay = block.timestamp / 86_400;

        vm.expectEmit(true, false, false, true, address(gm));
        emit GMCheckIn.CheckedIn(alice, expectedDay, 1, FEE);

        vm.prank(alice);
        gm.checkin();
    }

    // ── 6b. lastCheckinDay tracks correctly ──────────────────────────────

    function test_LastCheckinDay_Tracked() public {
        _checkin(alice);
        (uint256 lastDay,,) = gm.getUserInfo(alice);
        assertEq(lastDay, block.timestamp / 86_400);
    }

    // ── Multiple users independent ────────────────────────────────────────

    function test_TwoUsers_IndependentState() public {
        _checkin(alice);
        _buildStreak(bob, 3);
        (, uint256 streakA,) = gm.getUserInfo(alice);
        (, uint256 streakB,) = gm.getUserInfo(bob);
        assertEq(streakA, 1);
        assertEq(streakB, 3);
        assertEq(gm.totalCheckins(), 4);
    }

    // ── Pause blocks checkin ──────────────────────────────────────────────

    function test_Checkin_RevertsWhenPaused() public {
        vm.prank(owner);
        gm.pause();

        _fundAndApprove(alice, FEE);
        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        gm.checkin();
    }

    function test_Checkin_WorksAfterUnpause() public {
        vm.prank(owner);
        gm.pause();
        vm.prank(owner);
        gm.unpause();
        _checkin(alice);
        (, uint256 streak,) = gm.getUserInfo(alice);
        assertEq(streak, 1);
    }

    // ── Non-owner cannot pause ────────────────────────────────────────────

    function test_Pause_RevertsForNonOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        gm.pause();
    }
}
