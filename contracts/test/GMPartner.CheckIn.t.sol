// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMPartnerTestBase} from "./GMPartner.Base.t.sol";
import {GMPartner}         from "../GMPartner.sol";

/// @dev checkin() behaviour tests.
contract GMPartnerCheckInTest is GMPartnerTestBase {

    function setUp() public override {
        super.setUp();
        _activate(); // most checkin tests need an active contract
    }

    // ── 12. Reverts if contract not active ────────────────────────────────

    function test_CheckIn_Reverts_ContractNotActive() public {
        // Deploy a fresh, inactive partner
        uint256[4] memory mDays;
        mDays[0] = MILESTONE_0;
        mDays[1] = MILESTONE_1;
        GMPartner inactive = new GMPartner(
            owner, operator,
            address(mockCheckin), address(mockBuyback), address(mockMainPool),
            "Inactive", "", MILESTONE_COUNT, mDays, true
        );

        _fund(alice, CHECKIN_FEE);
        vm.prank(alice);
        usdc.approve(address(inactive), CHECKIN_FEE);
        vm.prank(alice);
        vm.expectRevert(GMPartner.ContractNotActive.selector);
        inactive.checkin();
    }

    // ── 13. Reverts if already checked in today ────────────────────────────

    function test_CheckIn_Reverts_AlreadyCheckedInToday() public {
        _checkin(alice);

        _fund(alice, CHECKIN_FEE);
        vm.prank(alice);
        vm.expectRevert(GMPartner.AlreadyCheckedInToday.selector);
        partner.checkin();
    }

    // ── 14. Updates partner streak correctly ──────────────────────────────

    function test_CheckIn_StreakOnFirstCheckin() public {
        _checkin(alice);
        (, uint256 streak, uint256 total) = partner.getUserInfo(alice);
        assertEq(streak, 1);
        assertEq(total, 1);
    }

    function test_CheckIn_StreakIncrements_Consecutive() public {
        _checkin(alice);
        vm.warp(block.timestamp + DAY);
        _checkin(alice);
        (, uint256 streak,) = partner.getUserInfo(alice);
        assertEq(streak, 2);
    }

    function test_CheckIn_StreakResets_AfterGap() public {
        _buildStreak(alice, 3);
        vm.warp(block.timestamp + 2 * DAY); // gap of 1 day
        _checkin(alice);
        (, uint256 streak,) = partner.getUserInfo(alice);
        assertEq(streak, 1);
    }

    // ── 15. Calls gmCheckin.partnerCheckin(user) ──────────────────────────

    function test_CheckIn_CallsPartnerCheckin() public {
        _checkin(alice);
        assertEq(mockCheckin.partnerCheckinCallCount(), 1);
        assertEq(mockCheckin.lastPartnerCheckinUser(), alice);
    }

    // ── 16. Fee split: 80% reward, 10% main, 10% buyback ─────────────────

    function test_CheckIn_FeeRewardPoolSplit() public {
        (uint256 expectedReward,,) = _split(CHECKIN_FEE);
        _checkin(alice);
        // The activation reward pool already has inject reward, check incremental
        // The pool balance should be: inject reward + checkin reward share
        (uint256 injectReward,,) = _split(MIN_INJECT);
        assertEq(partner.rewardPoolBalance(), injectReward + expectedReward);
    }

    function test_CheckIn_FeeMainPoolSplit() public {
        (, uint256 expectedMain,) = _split(CHECKIN_FEE);
        uint256 beforeMainPool = mockMainPool.totalInjected();
        _checkin(alice);
        assertEq(mockMainPool.totalInjected() - beforeMainPool, expectedMain);
    }

    // ── 16b. forceApprove reset after checkin ────────────────────────────

    function test_CheckIn_ForceApproveResetToZero() public {
        _checkin(alice);
        assertEq(usdc.allowance(address(partner), address(mockMainPool)), 0);
    }

    // ── 17. Emits PartnerCheckedIn ────────────────────────────────────────

    function test_CheckIn_EmitsPartnerCheckedIn() public {
        uint256 dayIndex = block.timestamp / DAY;

        _fund(alice, CHECKIN_FEE);
        vm.prank(alice);
        vm.expectEmit(true, false, false, true, address(partner));
        emit GMPartner.PartnerCheckedIn(alice, dayIndex, 1);
        partner.checkin();
    }

    // ── totalCheckins increments ───────────────────────────────────────────

    function test_CheckIn_TotalCheckinsIncrement() public {
        _checkin(alice);
        _checkin(bob);
        assertEq(partner.totalCheckins(), 2);
    }

    // ── Fee is pulled from user ────────────────────────────────────────────

    function test_CheckIn_FeeDeductedFromUser() public {
        usdc.mint(alice, CHECKIN_FEE);
        vm.prank(alice);
        usdc.approve(address(partner), CHECKIN_FEE);

        uint256 balBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        partner.checkin();
        uint256 balAfter = usdc.balanceOf(alice);

        assertEq(balBefore - balAfter, CHECKIN_FEE);
    }
}
