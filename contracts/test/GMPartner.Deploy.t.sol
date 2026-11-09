// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMPartnerTestBase} from "./GMPartner.Base.t.sol";
import {GMPartner}         from "../GMPartner.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @dev Constructor validation + isExpired tests.
contract GMPartnerDeployTest is GMPartnerTestBase {

    // ── 1. Successful deploy sets storage correctly ───────────────────────

    function test_Deploy_SetsProjectName() public view {
        assertEq(partner.projectName(), "GM Protocol test");
    }

    function test_Deploy_SetsMilestoneCount() public view {
        assertEq(partner.milestoneCount(), MILESTONE_COUNT);
    }

    function test_Deploy_SetsMilestoneDays() public view {
        assertEq(partner.milestoneDays(0), MILESTONE_0);
        assertEq(partner.milestoneDays(1), MILESTONE_1);
    }

    function test_Deploy_IsNotActiveInitially() public view {
        assertFalse(partner.isActive());
    }

    function test_Deploy_ActivationDeadlineSetCorrectly() public view {
        assertEq(partner.activationDeadline(), START_TS + 7 days);
    }

    function test_Deploy_IsTestnetTrue() public view {
        assertTrue(partner.isTestnet());
    }

    function test_Deploy_OperatorSet() public view {
        assertEq(partner.operator(), operator);
    }

    function test_Deploy_OwnerSet() public view {
        assertEq(partner.owner(), owner);
    }

    // ── 1b. zero protocol addresses revert ZeroAddress ────────────────────

    function _deployWith(address checkin_, address buyback_, address mainPool_) internal returns (GMPartner) {
        uint256[4] memory mDays;
        mDays[0] = MILESTONE_0;
        mDays[1] = MILESTONE_1;
        return new GMPartner(
            owner, operator, checkin_, buyback_, mainPool_,
            "X", "y", MILESTONE_COUNT, mDays, true
        );
    }

    function test_Deploy_Reverts_ZeroGmCheckin() public {
        vm.expectRevert(GMPartner.ZeroAddress.selector);
        _deployWith(address(0), address(mockBuyback), address(mockMainPool));
    }

    function test_Deploy_Reverts_ZeroGmBuyback() public {
        vm.expectRevert(GMPartner.ZeroAddress.selector);
        _deployWith(address(mockCheckin), address(0), address(mockMainPool));
    }

    function test_Deploy_Reverts_ZeroGmMainPool() public {
        vm.expectRevert(GMPartner.ZeroAddress.selector);
        _deployWith(address(mockCheckin), address(mockBuyback), address(0));
    }

    function test_Deploy_NonZeroProtocolAddressesStored() public {
        GMPartner p = _deployWith(address(mockCheckin), address(mockBuyback), address(mockMainPool));
        assertEq(address(p.gmCheckin()), address(mockCheckin));
        assertEq(address(p.gmBuyback()), address(mockBuyback));
        assertEq(address(p.gmMainPool()), address(mockMainPool));
    }

    // ── 1c. Ownable2Step ──────────────────────────────────────────────────

    function test_TransferOwnership_OnlySetsPendingOwner() public {
        vm.expectEmit(true, true, false, false, address(partner));
        emit Ownable2Step.OwnershipTransferStarted(owner, alice);
        vm.prank(owner);
        partner.transferOwnership(alice);
        assertEq(partner.owner(), owner, "owner unchanged");
        assertEq(partner.pendingOwner(), alice);

        // pending owner has no owner privileges yet
        vm.prank(alice);
        vm.expectRevert(GMPartner.NotOwner.selector);
        partner.setOperator(alice);
    }

    function test_TransferOwnership_NonOwnerReverts() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        partner.transferOwnership(alice);
    }

    function test_AcceptOwnership_ByPendingOwnerCompletesTransfer() public {
        vm.prank(owner);
        partner.transferOwnership(alice);

        vm.expectEmit(true, true, false, false, address(partner));
        emit Ownable.OwnershipTransferred(owner, alice);
        vm.prank(alice);
        partner.acceptOwnership();

        assertEq(partner.owner(), alice);
        assertEq(partner.pendingOwner(), address(0));

        vm.prank(owner);
        vm.expectRevert(GMPartner.NotOwner.selector);
        partner.setOperator(owner);
        vm.prank(alice);
        partner.setOperator(bob);
        assertEq(partner.operator(), bob);
    }

    function test_AcceptOwnership_ByNonPendingReverts() public {
        vm.prank(owner);
        partner.transferOwnership(alice);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, bob));
        partner.acceptOwnership();
        assertEq(partner.owner(), owner);
    }

    // ── 2. milestoneCount 0 reverts InvalidMilestoneCount ─────────────────

    function test_Deploy_Reverts_MilestoneCountZero() public {
        uint256[4] memory mDays;
        mDays[0] = 7;
        vm.expectRevert(
            abi.encodeWithSelector(GMPartner.InvalidMilestoneCount.selector, uint8(0))
        );
        new GMPartner(
            owner, operator,
            address(mockCheckin), address(mockBuyback), address(mockMainPool),
            "X", "y", 0, mDays, true
        );
    }

    // ── 3. milestoneCount 5 reverts InvalidMilestoneCount ─────────────────

    function test_Deploy_Reverts_MilestoneCountFive() public {
        uint256[4] memory mDays;
        mDays[0] = 7; mDays[1] = 14; mDays[2] = 30; mDays[3] = 60;
        vm.expectRevert(
            abi.encodeWithSelector(GMPartner.InvalidMilestoneCount.selector, uint8(5))
        );
        new GMPartner(
            owner, operator,
            address(mockCheckin), address(mockBuyback), address(mockMainPool),
            "X", "y", 5, mDays, true
        );
    }

    // ── 4. milestoneDays not ascending reverts InvalidMilestoneDays ────────

    function test_Deploy_Reverts_MilestoneDaysNotAscending() public {
        uint256[4] memory mDays;
        mDays[0] = 14; mDays[1] = 7; // descending
        vm.expectRevert(GMPartner.InvalidMilestoneDays.selector);
        new GMPartner(
            owner, operator,
            address(mockCheckin), address(mockBuyback), address(mockMainPool),
            "X", "y", 2, mDays, true
        );
    }

    // ── 5. milestoneDays < 7 reverts InvalidMilestoneDays ─────────────────

    function test_Deploy_Reverts_MilestoneDaysTooSmall() public {
        uint256[4] memory mDays;
        mDays[0] = 6; // < 7
        vm.expectRevert(GMPartner.InvalidMilestoneDays.selector);
        new GMPartner(
            owner, operator,
            address(mockCheckin), address(mockBuyback), address(mockMainPool),
            "X", "y", 1, mDays, true
        );
    }

    // ── 6. milestoneDays > 365 reverts InvalidMilestoneDays ───────────────

    function test_Deploy_Reverts_MilestoneDaysTooLarge() public {
        uint256[4] memory mDays;
        mDays[0] = 366; // > 365
        vm.expectRevert(GMPartner.InvalidMilestoneDays.selector);
        new GMPartner(
            owner, operator,
            address(mockCheckin), address(mockBuyback), address(mockMainPool),
            "X", "y", 1, mDays, true
        );
    }

    // ── 7. isExpired() returns false when active ───────────────────────────

    function test_IsExpired_FalseWhenActive() public {
        _activate();
        assertFalse(partner.isExpired());
    }

    // ── 8. isExpired() returns true when deadline passed and not active ────

    function test_IsExpired_TrueAfterDeadline() public {
        // Don't activate; warp past deadline
        vm.warp(partner.activationDeadline() + 1);
        assertTrue(partner.isExpired());
    }

    // ── 9. expireContract reverts if still within deadline ────────────────

    function test_ExpireContract_RevertsIfDeadlineNotPassed() public {
        vm.prank(owner);
        vm.expectRevert(GMPartner.ActivationWindowExpired.selector);
        partner.expireContract();
    }

    // ── 10. expireContract reverts if already active ─────────────────────

    function test_ExpireContract_RevertsIfAlreadyActive() public {
        _activate();
        vm.prank(owner);
        vm.expectRevert(GMPartner.AlreadyActive.selector);
        partner.expireContract();
    }

    // ── 11. expireContract succeeds after deadline if not active ──────────

    function test_ExpireContract_Succeeds() public {
        vm.warp(partner.activationDeadline() + 1);
        vm.prank(owner);
        partner.expireContract();
        assertEq(partner.activationDeadline(), 0);
    }
}
