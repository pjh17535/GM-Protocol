// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMPoolTestBase} from "./GMPool.Base.t.sol";
import {GMPool} from "../GMPool.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @dev Tests: all revert paths across every public/external function.
contract GMPoolRevertTest is GMPoolTestBase {

    // ══════════════════════════════════════════════════════════════════════
    // receiveCheckinFee
    // ══════════════════════════════════════════════════════════════════════

    function test_ReceiveCheckinFee_ZeroAmount_Reverts() public {
        vm.prank(checkinContract);
        vm.expectRevert(GMPool.InvalidAmount.selector);
        pool.receiveCheckinFee(0);
    }

    // ══════════════════════════════════════════════════════════════════════
    // withdrawReserve
    // ══════════════════════════════════════════════════════════════════════

    function test_WithdrawReserve_OnlyBuyback_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(GMPool.Unauthorized.selector);
        pool.withdrawReserve(1e6);
    }

    function test_WithdrawReserve_OwnerReverts() public {
        vm.prank(owner);
        vm.expectRevert(GMPool.Unauthorized.selector);
        pool.withdrawReserve(1e6);
    }

    function test_WithdrawReserve_InsufficientBalance_Reverts() public {
        // No funds deposited → reserve balance == 0
        vm.prank(buybackContract);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMPool.InsufficientPoolBalance.selector,
                POOL_RESERVE,
                uint256(0),
                uint256(1e6)
            )
        );
        pool.withdrawReserve(1e6);
    }

    function test_WithdrawReserve_ZeroAmount_Reverts() public {
        vm.prank(buybackContract);
        vm.expectRevert(GMPool.InvalidAmount.selector);
        pool.withdrawReserve(0);
    }

    // ══════════════════════════════════════════════════════════════════════
    // withdrawReward
    // ══════════════════════════════════════════════════════════════════════

    function test_WithdrawReward_OnlyCheckin_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(GMPool.Unauthorized.selector);
        pool.withdrawReward(1e6, alice);
    }

    function test_WithdrawReward_InsufficientBalance_Reverts() public {
        vm.prank(checkinContract);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMPool.InsufficientPoolBalance.selector,
                POOL_REWARD,
                uint256(0),
                uint256(1e6)
            )
        );
        pool.withdrawReward(1e6, alice);
    }

    function test_WithdrawReward_ZeroAddress_Reverts() public {
        _doCheckin(100e6);
        vm.prank(checkinContract);
        vm.expectRevert(GMPool.ZeroAddress.selector);
        pool.withdrawReward(1e6, address(0));
    }

    // ══════════════════════════════════════════════════════════════════════
    // withdrawProtocol
    // ══════════════════════════════════════════════════════════════════════

    function test_WithdrawProtocol_OnlyOwner_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice)
        );
        pool.withdrawProtocol(1e6, alice);
    }

    function test_WithdrawProtocol_InsufficientBalance_Reverts() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMPool.InsufficientPoolBalance.selector,
                POOL_PROTOCOL,
                uint256(0),
                uint256(1e6)
            )
        );
        pool.withdrawProtocol(1e6, alice);
    }

    // ══════════════════════════════════════════════════════════════════════
    // withdrawPartner
    // ══════════════════════════════════════════════════════════════════════

    function test_WithdrawPartner_OnlyOwner_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice)
        );
        pool.withdrawPartner(1e6, alice);
    }

    function test_WithdrawPartner_InsufficientBalance_Reverts() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMPool.InsufficientPoolBalance.selector,
                POOL_PARTNER,
                uint256(0),
                uint256(1e6)
            )
        );
        pool.withdrawPartner(1e6, alice);
    }

    // ══════════════════════════════════════════════════════════════════════
    // setGTotal
    // ══════════════════════════════════════════════════════════════════════

    function test_SetGTotal_ZeroReverts() public {
        vm.prank(owner);
        vm.expectRevert(GMPool.GTotalMustBePositive.selector);
        pool.setGTotal(0);
    }

    function test_SetGTotal_AlreadySet_Reverts() public {
        vm.startPrank(owner);
        pool.setGTotal(G_TOTAL);
        vm.expectRevert(GMPool.GTotalAlreadySet.selector);
        pool.setGTotal(G_TOTAL);
        vm.stopPrank();
    }

    function test_SetGTotal_OnlyOwner_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice)
        );
        pool.setGTotal(G_TOTAL);
    }

    // ══════════════════════════════════════════════════════════════════════
    // executeQuarterlyInjection
    // ══════════════════════════════════════════════════════════════════════

    function test_ExecuteQuarterly_GTotalNotSet_Reverts() public {
        vm.prank(owner);
        vm.expectRevert(GMPool.GTotalNotSet.selector);
        pool.executeQuarterlyInjection(1e6);
    }

    function test_ExecuteQuarterly_AmountOutOfRange_Reverts() public {
        vm.startPrank(owner);
        pool.setGTotal(G_TOTAL);
        vm.stopPrank();

        // expected Q1 amount = G_TOTAL * (49 - 2) / 576 = G_TOTAL * 47 / 576
        uint256 expected = (G_TOTAL * 47) / 576;
        uint256 tooLow   = (expected * 94) / 100; // below 95% floor

        _fund(owner, tooLow);

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMPool.QuarterlyAmountOutOfRange.selector,
                expected,
                tooLow,
                (expected * 95) / 100,
                (expected * 105) / 100
            )
        );
        pool.executeQuarterlyInjection(tooLow);
    }

    function test_ExecuteQuarterly_OnlyOwner_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice)
        );
        pool.executeQuarterlyInjection(1e6);
    }

    // ══════════════════════════════════════════════════════════════════════
    // emergencyWithdraw
    // ══════════════════════════════════════════════════════════════════════

    function test_EmergencyWithdraw_USDC_Reverts() public {
        vm.prank(owner);
        vm.expectRevert(GMPool.CannotRescueUSDC.selector);
        pool.emergencyWithdraw(USDC_ADDR, alice, 1e6);
    }

    function test_EmergencyWithdraw_OnlyOwner_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice)
        );
        pool.emergencyWithdraw(makeAddr("someToken"), alice, 1e6);
    }

    function test_EmergencyWithdraw_ZeroAmount_Reverts() public {
        vm.prank(owner);
        vm.expectRevert(GMPool.InvalidAmount.selector);
        pool.emergencyWithdraw(makeAddr("someToken"), alice, 0);
    }

    function test_EmergencyWithdraw_ZeroTokenAddress_Reverts() public {
        vm.prank(owner);
        vm.expectRevert(GMPool.ZeroAddress.selector);
        pool.emergencyWithdraw(address(0), alice, 1e6);
    }

    // ══════════════════════════════════════════════════════════════════════
    // Constructor
    // ══════════════════════════════════════════════════════════════════════

    function test_Constructor_ZeroOwner_Reverts() public {
        // OZ Ownable(address(0)) fires OwnableInvalidOwner before our ZeroAddress check.
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableInvalidOwner.selector, address(0))
        );
        new GMPool(address(0), 0);
    }
}
