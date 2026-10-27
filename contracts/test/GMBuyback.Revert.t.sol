// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMBuybackTestBase} from "./GMBuyback.Base.t.sol";
import {GMBuyback} from "../GMBuyback.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @dev Tests: deployment state, all revert paths, pause, setReserveVault.
contract GMBuybackRevertTest is GMBuybackTestBase {

    // ══════════════════════════════════════════════════════════════════════
    //  Deployment & initialization
    // ══════════════════════════════════════════════════════════════════════

    function test_Deploy_OwnerIsSet() public view {
        assertEq(buyback.owner(), owner);
    }

    function test_Deploy_ReserveVaultIsSet() public view {
        assertEq(buyback.reserveVault(), reserveVault);
    }

    function test_Deploy_DefaultParams() public view {
        assertEq(buyback.minBuybackAmount(), DEFAULT_MIN);
        assertEq(buyback.cooldownPeriod(),   DEFAULT_COOLDOWN);
        assertEq(buyback.maxSingleBuyback(), DEFAULT_MAX);
        assertEq(buyback.baseIncentiveBps(), BASE_BPS);
        assertEq(buyback.maxIncentiveBps(),  MAX_BPS);
    }

    function test_Deploy_CountersZero() public view {
        assertEq(buyback.lastBuybackTime(), 0);
        assertEq(buyback.totalUsdcUsed(),   0);
        assertEq(buyback.totalGarcBurned(), 0);
        assertEq(buyback.triggerCount(),    0);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  executeBuyback — cooldown revert
    // ══════════════════════════════════════════════════════════════════════

    function test_ExecuteBuyback_RevertsIfCooldownNotElapsed() public {
        // Fund vault so the only failure is the cooldown check.
        _fundVault(5e6);

        // Execute once to set lastBuybackTime.
        vm.prank(alice);
        buyback.executeBuyback();

        // Immediately try again — should revert with CooldownActive.
        uint256 nextAllowed = block.timestamp + DEFAULT_COOLDOWN;
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMBuyback.CooldownActive.selector,
                block.timestamp,
                nextAllowed
            )
        );
        buyback.executeBuyback();
    }

    function test_ExecuteBuyback_RevertsExactlyAtCooldownBoundary() public {
        _fundVault(5e6);
        vm.prank(alice);
        buyback.executeBuyback();

        // One second before cooldown expires → revert.
        vm.warp(block.timestamp + DEFAULT_COOLDOWN - 1);
        _fundVault(5e6);
        uint256 nextAllowed = buyback.lastBuybackTime() + DEFAULT_COOLDOWN;
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMBuyback.CooldownActive.selector,
                block.timestamp,
                nextAllowed
            )
        );
        buyback.executeBuyback();
    }

    // ══════════════════════════════════════════════════════════════════════
    //  executeBuyback — balance too low
    // ══════════════════════════════════════════════════════════════════════

    function test_ExecuteBuyback_RevertsIfVaultBalanceBelowMin() public {
        // Vault has less than minBuybackAmount (1e6).
        _fundVault(0.5e6);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMBuyback.BuybackAmountTooLow.selector,
                uint256(0.5e6),
                uint256(DEFAULT_MIN)
            )
        );
        buyback.executeBuyback();
    }

    function test_ExecuteBuyback_RevertsIfVaultEmpty() public {
        // No USDC in vault at all.
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMBuyback.BuybackAmountTooLow.selector,
                uint256(0),
                uint256(DEFAULT_MIN)
            )
        );
        buyback.executeBuyback();
    }

    // ══════════════════════════════════════════════════════════════════════
    //  pause() — blocks executeBuyback
    // ══════════════════════════════════════════════════════════════════════

    function test_Pause_BlocksExecuteBuyback() public {
        _fundVault(5e6);

        vm.prank(owner);
        buyback.pause();

        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        buyback.executeBuyback();
    }

    function test_Pause_OnlyOwnerCanPause() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice)
        );
        buyback.pause();
    }

    function test_Unpause_RestoresExecution() public {
        _fundVault(5e6);

        vm.prank(owner);
        buyback.pause();

        vm.prank(owner);
        buyback.unpause();

        // Should now succeed.
        vm.prank(alice);
        buyback.executeBuyback();
    }

    // ══════════════════════════════════════════════════════════════════════
    //  setReserveVault — access control
    // ══════════════════════════════════════════════════════════════════════

    function test_SetReserveVault_OnlyOwner() public {
        address newVault = makeAddr("newVault");
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice)
        );
        buyback.setReserveVault(newVault);
    }

    function test_SetReserveVault_OwnerSucceeds() public {
        address newVault = makeAddr("newVault");
        vm.prank(owner);
        buyback.setReserveVault(newVault);
        assertEq(buyback.reserveVault(), newVault);
    }

    function test_SetReserveVault_EmitsEvent() public {
        address newVault = makeAddr("newVault");
        vm.prank(owner);
        vm.expectEmit(true, false, false, false, address(buyback));
        emit GMBuyback.ReserveVaultUpdated(newVault);
        buyback.setReserveVault(newVault);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  setIncentiveParams — validation
    // ══════════════════════════════════════════════════════════════════════

    function test_SetIncentiveParams_RevertsIfBaseBpsAboveCap() public {
        // baseBps > 10 → IncentiveParamsTooHigh
        vm.prank(owner);
        vm.expectRevert(GMBuyback.IncentiveParamsTooHigh.selector);
        buyback.setIncentiveParams(11, 100);
    }

    function test_SetIncentiveParams_RevertsIfMaxBpsAboveCap() public {
        // maxBps > 100 → IncentiveParamsTooHigh
        vm.prank(owner);
        vm.expectRevert(GMBuyback.IncentiveParamsTooHigh.selector);
        buyback.setIncentiveParams(5, 101);
    }

    function test_SetIncentiveParams_RevertsIfBaseExceedsMax() public {
        // baseBps > maxBps → InvalidIncentiveParams
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMBuyback.InvalidIncentiveParams.selector,
                uint256(10),
                uint256(9)
            )
        );
        buyback.setIncentiveParams(10, 9);
    }

    function test_SetIncentiveParams_OwnerCanSetWithinCaps() public {
        vm.prank(owner);
        buyback.setIncentiveParams(5, 50);
        assertEq(buyback.baseIncentiveBps(), 5);
        assertEq(buyback.maxIncentiveBps(),  50);
    }

    function test_SetIncentiveParams_EmitsEvent() public {
        vm.prank(owner);
        vm.expectEmit(false, false, false, true, address(buyback));
        emit GMBuyback.IncentiveParamsUpdated(5, 50);
        buyback.setIncentiveParams(5, 50);
    }

    function test_SetIncentiveParams_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice)
        );
        buyback.setIncentiveParams(5, 50);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  canExecute — view helper
    // ══════════════════════════════════════════════════════════════════════

    function test_CanExecute_FalseBeforeCooldown() public {
        _fundVault(5e6);
        vm.prank(alice);
        buyback.executeBuyback();

        // Still within cooldown → false.
        assertFalse(buyback.canExecute());
    }

    function test_CanExecute_TrueAfterCooldown() public {
        _fundVault(5e6);
        vm.prank(alice);
        buyback.executeBuyback();

        _skipCooldowns(1);
        _fundVault(5e6);
        assertTrue(buyback.canExecute());
    }

    function test_CanExecute_FalseIfVaultBelowMin() public {
        // Warp past cooldown but vault is empty → false.
        _skipCooldowns(1);
        assertFalse(buyback.canExecute());
    }
}
