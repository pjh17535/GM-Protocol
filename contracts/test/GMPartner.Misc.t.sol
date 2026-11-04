// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMPartnerTestBase} from "./GMPartner.Base.t.sol";
import {GMPartner}         from "../GMPartner.sol";
import {Ownable}           from "@openzeppelin/contracts/access/Ownable.sol";

/// @dev setOperator, setLogoURI, expireContract, access-control tests.
contract GMPartnerMiscTest is GMPartnerTestBase {

    // ── 26. setOperator — only owner ──────────────────────────────────────

    function test_SetOperator_OwnerCanSet() public {
        address newOp = makeAddr("newOp");
        vm.prank(owner);
        partner.setOperator(newOp);
        assertEq(partner.operator(), newOp);
    }

    function test_SetOperator_EmitsOperatorUpdated() public {
        address newOp = makeAddr("newOp");
        vm.prank(owner);
        vm.expectEmit(true, false, false, false, address(partner));
        emit GMPartner.OperatorUpdated(newOp);
        partner.setOperator(newOp);
    }

    function test_SetOperator_NonOwnerReverts() public {
        address newOp = makeAddr("newOp");
        vm.prank(alice);
        vm.expectRevert(GMPartner.NotOwner.selector);
        partner.setOperator(newOp);
    }

    function test_SetOperator_OperatorCannotSetOperator() public {
        address newOp = makeAddr("newOp");
        vm.prank(operator);
        vm.expectRevert(GMPartner.NotOwner.selector);
        partner.setOperator(newOp);
    }

    // ── setLogoURI — owner or operator ────────────────────────────────────

    function test_SetLogoURI_OwnerCanSet() public {
        vm.prank(owner);
        partner.setLogoURI("https://logo.com/img.png");
        assertEq(partner.projectLogoURI(), "https://logo.com/img.png");
    }

    function test_SetLogoURI_OperatorCanSet() public {
        vm.prank(operator);
        partner.setLogoURI("https://logo.com/img.png");
        assertEq(partner.projectLogoURI(), "https://logo.com/img.png");
    }

    function test_SetLogoURI_NonOperatorReverts() public {
        vm.prank(alice);
        vm.expectRevert(GMPartner.NotOperator.selector);
        partner.setLogoURI("https://logo.com/img.png");
    }

    function test_SetLogoURI_EmitsLogoURIUpdated() public {
        string memory uri = "https://logo.com/img.png";
        vm.prank(owner);
        vm.expectEmit(false, false, false, true, address(partner));
        emit GMPartner.LogoURIUpdated(uri);
        partner.setLogoURI(uri);
    }

    // ── 28. isExpired returns false when active, true when expired ─────────

    function test_IsExpired_FalseAfterActivation() public {
        _activate();
        assertFalse(partner.isExpired());
    }

    function test_IsExpired_FalseWithinDeadline() public {
        // not active, but still within activation window
        assertFalse(partner.isExpired());
    }

    function test_IsExpired_TrueAfterDeadlinePassed() public {
        vm.warp(partner.activationDeadline() + 1);
        assertTrue(partner.isExpired());
    }

    // ── getMinInjection ────────────────────────────────────────────────────

    function test_GetMinInjection_Testnet() public view {
        assertEq(partner.getMinInjection(), 10e6);
    }

    function test_GetMinInjection_Mainnet() public {
        uint256[4] memory mDays;
        mDays[0] = MILESTONE_0;
        mDays[1] = MILESTONE_1;
        GMPartner mainnetPartner = new GMPartner(
            owner, operator,
            address(mockCheckin), address(mockBuyback), address(mockMainPool),
            "Mainnet Project", "", MILESTONE_COUNT, mDays, false
        );
        assertEq(mainnetPartner.getMinInjection(), 2_000e6);
    }

    // ── getMilestoneStatus ─────────────────────────────────────────────────

    function test_GetMilestoneStatus_Reached() public {
        _activate();
        _buildStreak(alice, MILESTONE_0);
        (bool reached, bool queued,,) = partner.getMilestoneStatus(alice, 0);
        assertTrue(reached);
        assertFalse(queued);
    }

    function test_GetMilestoneStatus_Queued() public {
        _activate();
        _buildStreak(alice, MILESTONE_0);
        vm.prank(alice);
        partner.queueMilestoneClaim(0);
        (, bool queued,,) = partner.getMilestoneStatus(alice, 0);
        assertTrue(queued);
    }

    // ── getUserInfo ────────────────────────────────────────────────────────

    function test_GetUserInfo_InitiallyZero() public view {
        (uint256 lastDay, uint256 streak, uint256 total) = partner.getUserInfo(alice);
        assertEq(lastDay, 0);
        assertEq(streak, 0);
        assertEq(total, 0);
    }
}
