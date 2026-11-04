// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMCheckInTestBase} from "./GMCheckIn.Base.t.sol";
import {GMCheckIn}         from "../GMCheckIn.sol";

/// @dev Tests for GMCheckIn.partnerCheckin (new function, tests 29-33).
///
/// partnerCheckin can only be called by a registered partner address that
/// is also a contract (code.length > 0). We use a lightweight helper contract
/// (PartnerCaller) deployed in setUp to act as the registered partner caller.
contract GMCheckInPartnerCheckinTest is GMCheckInTestBase {

    /// @dev Minimal contract that can call gm.partnerCheckin on behalf of a user.
    PartnerCaller internal callerContract;

    function setUp() public override {
        super.setUp();
        // Deploy the caller contract (it must have code.length > 0)
        callerContract = new PartnerCaller(address(gm));
        // Register it with the GMCheckIn owner
        vm.prank(owner);
        gm.setPartnerRegistered(address(callerContract), true);
    }

    // ── 29. Non-registered address reverts NotRegisteredPartner ───────────

    function test_PartnerCheckin_UnregisteredAddress_Reverts() public {
        address unregistered = makeAddr("unregistered");
        // EOA, not registered — will revert both NotRegisteredPartner checks
        vm.prank(unregistered);
        vm.expectRevert(GMCheckIn.NotRegisteredPartner.selector);
        gm.partnerCheckin(alice);
    }

    // ── 30. Non-contract (EOA) address reverts even if registered ─────────
    // The contract checks code.length == 0 AFTER the registeredPartners check,
    // so the same NotRegisteredPartner error is emitted for both paths.

    function test_PartnerCheckin_RegisteredEOA_Reverts() public {
        address eoa = makeAddr("eoa");
        // Register the EOA
        vm.prank(owner);
        gm.setPartnerRegistered(eoa, true);

        // EOA calling — msg.sender.code.length == 0 → NotRegisteredPartner
        vm.prank(eoa);
        vm.expectRevert(GMCheckIn.NotRegisteredPartner.selector);
        gm.partnerCheckin(alice);
    }

    // ── 31. Registered contract can call for valid user ───────────────────

    function test_PartnerCheckin_RegisteredContract_Succeeds() public {
        // callerContract is registered; alice is a valid (non-zero) address
        callerContract.doCheckin(alice);

        (, uint256 streak, uint256 total) = gm.getUserInfo(alice);
        assertEq(streak, 1);
        assertEq(total, 1);
    }

    // ── 32. Already checked in today — silent success (no revert) ─────────

    function test_PartnerCheckin_AlreadyCheckedInToday_SilentSuccess() public {
        // First call: records check-in
        callerContract.doCheckin(alice);

        // Second call on same day: should NOT revert, just emit and return
        callerContract.doCheckin(alice); // must not revert

        // State must not have advanced
        (, uint256 streak, uint256 total) = gm.getUserInfo(alice);
        assertEq(streak, 1);
        assertEq(total, 1);
    }

    // ── 33. Updates streak correctly ──────────────────────────────────────

    function test_PartnerCheckin_StreakIncrements_Consecutive() public {
        callerContract.doCheckin(alice); // day 1000

        vm.warp(block.timestamp + 86_400);
        callerContract.doCheckin(alice); // day 1001

        (, uint256 streak, uint256 total) = gm.getUserInfo(alice);
        assertEq(streak, 2);
        assertEq(total, 2);
    }

    function test_PartnerCheckin_StreakResets_AfterGap() public {
        callerContract.doCheckin(alice); // day 1000

        vm.warp(block.timestamp + 2 * 86_400); // day 1002 — gap
        callerContract.doCheckin(alice);

        (, uint256 streak,) = gm.getUserInfo(alice);
        assertEq(streak, 1);
    }

    function test_PartnerCheckin_ThreeConsecutiveDays() public {
        for (uint256 i = 0; i < 3; i++) {
            if (i > 0) vm.warp(block.timestamp + 86_400);
            callerContract.doCheckin(alice);
        }
        (, uint256 streak, uint256 total) = gm.getUserInfo(alice);
        assertEq(streak, 3);
        assertEq(total, 3);
    }

    // ── Emits PartnerCheckinRecorded ──────────────────────────────────────

    function test_PartnerCheckin_EmitsPartnerCheckinRecorded() public {
        uint256 dayIndex = block.timestamp / 86_400;

        vm.expectEmit(true, true, false, true, address(gm));
        emit GMCheckIn.PartnerCheckinRecorded(alice, address(callerContract), dayIndex, 1);
        callerContract.doCheckin(alice);
    }

    // ── totalCheckins increments ───────────────────────────────────────────

    function test_PartnerCheckin_TotalCheckinsIncrement() public {
        uint256 before = gm.totalCheckins();
        callerContract.doCheckin(alice);
        assertEq(gm.totalCheckins(), before + 1);
    }

    // ── partnerCheckin does not pull a fee from user ──────────────────────

    function test_PartnerCheckin_NoFeeDeducted() public {
        uint256 aliceBal = usdc.balanceOf(alice);
        callerContract.doCheckin(alice);
        assertEq(usdc.balanceOf(alice), aliceBal); // no USDC moved
    }

    // ── Paused contract reverts ────────────────────────────────────────────

    function test_PartnerCheckin_RevertsWhenPaused() public {
        vm.prank(owner);
        gm.pause();

        vm.expectRevert(); // Pausable.EnforcedPause
        callerContract.doCheckin(alice);
    }
}

/// @dev Minimal helper contract that wraps GMCheckIn.partnerCheckin.
///      Deployed inline; has code (code.length > 0).
contract PartnerCaller {
    GMCheckIn internal immutable gm;

    constructor(address _gm) {
        gm = GMCheckIn(_gm);
    }

    function doCheckin(address user) external {
        gm.partnerCheckin(user);
    }
}
