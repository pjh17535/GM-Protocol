// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMPartnerTestBase} from "./GMPartner.Base.t.sol";
import {GMPartner}         from "../GMPartner.sol";

/// @dev injectFunds behaviour tests.
contract GMPartnerInjectFundsTest is GMPartnerTestBase {

    // ── 4. Reverts if activationDeadline passed and not active ────────────

    function test_InjectFunds_Reverts_ActivationWindowExpired() public {
        vm.warp(partner.activationDeadline() + 1);
        _fund(alice, MIN_INJECT);
        vm.prank(alice);
        vm.expectRevert(GMPartner.ActivationWindowExpired.selector);
        partner.injectFunds(MIN_INJECT);
    }

    // ── 5. Reverts if amount < minInjection on first inject (testnet=10 USDC)

    function test_InjectFunds_Reverts_InsufficientInjection() public {
        uint256 tooLittle = MIN_INJECT - 1;
        _fund(alice, tooLittle);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMPartner.InsufficientInjection.selector,
                MIN_INJECT,
                tooLittle
            )
        );
        partner.injectFunds(tooLittle);
    }

    // ── 6. Activates when totalInjected crosses minInjection ──────────────

    function test_InjectFunds_ActivatesContract() public {
        assertFalse(partner.isActive());
        _activate();
        assertTrue(partner.isActive());
    }

    // ── 7. Emits ContractActivated on activation ──────────────────────────

    function test_InjectFunds_EmitsContractActivated() public {
        _fund(alice, MIN_INJECT);
        vm.prank(alice);
        vm.expectEmit(false, false, false, true, address(partner));
        emit GMPartner.ContractActivated(MIN_INJECT, START_TS);
        partner.injectFunds(MIN_INJECT);
    }

    // ── 8. Correct 80/10/10 split — rewardPoolBalance gets 80% ────────────

    function test_InjectFunds_RewardPoolBalance_80Pct() public {
        uint256 amount = MIN_INJECT;
        (uint256 expectedReward,,) = _split(amount);

        _fund(alice, amount);
        vm.prank(alice);
        partner.injectFunds(amount);

        assertEq(partner.rewardPoolBalance(), expectedReward);
    }

    // ── 9. mainGMShare forwarded to gmMainPool.injectFunds ────────────────

    function test_InjectFunds_MainPoolReceives10Pct() public {
        uint256 amount = MIN_INJECT;
        (, uint256 expectedMain,) = _split(amount);

        _fund(alice, amount);
        vm.prank(alice);
        partner.injectFunds(amount);

        assertEq(mockMainPool.totalInjected(), expectedMain);
        assertEq(mockMainPool.injectCallCount(), 1);
    }

    // ── 10. Top-up after activation works (no deadline check) ─────────────

    function test_InjectFunds_TopUpAfterActivation() public {
        _activate();

        // Warp past original activation deadline — should still succeed
        vm.warp(partner.activationDeadline() + 100 days);

        uint256 topUp = 5e6;
        _fund(bob, topUp);
        vm.prank(bob);
        partner.injectFunds(topUp); // must not revert

        uint256 totalExpected = MIN_INJECT + topUp;
        assertEq(partner.totalInjected(), totalExpected);
    }

    // ── 11. forceApprove reset to 0 after injectFunds call ────────────────

    function test_InjectFunds_ForceApproveResetToZero() public {
        _fund(alice, MIN_INJECT);
        vm.prank(alice);
        partner.injectFunds(MIN_INJECT);

        // After the call, allowance from partner → mainPool must be 0
        assertEq(
            usdc.allowance(address(partner), address(mockMainPool)),
            0
        );
    }

    // ── 11b. Emits FundsInjected ───────────────────────────────────────────

    function test_InjectFunds_EmitsFundsInjected() public {
        uint256 amount = MIN_INJECT;
        (uint256 rewardShare, uint256 mainShare, uint256 buybackShare) = _split(amount);

        _fund(alice, amount);
        vm.prank(alice);
        vm.expectEmit(true, false, false, true, address(partner));
        emit GMPartner.FundsInjected(alice, amount, rewardShare, mainShare, buybackShare);
        partner.injectFunds(amount);
    }

    // ── Two-step injection reverts if each call is below minInjection ─────
    // The contract requires (totalInjected + amount) >= minInjection each time
    // before activation. A partial amount that leaves projected < min reverts.

    function test_InjectFunds_PartialBelowMin_Reverts() public {
        uint256 half = MIN_INJECT / 2; // 5e6, projected = 5e6 < 10e6

        _fund(alice, half);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                GMPartner.InsufficientInjection.selector,
                MIN_INJECT,
                half
            )
        );
        partner.injectFunds(half);
    }

    // ── Injecting exactly minInjection in one call activates ──────────────

    function test_InjectFunds_ExactMinimum_Activates() public {
        _fund(alice, MIN_INJECT);
        vm.prank(alice);
        partner.injectFunds(MIN_INJECT);
        assertTrue(partner.isActive());
        assertEq(partner.totalInjected(), MIN_INJECT);
    }
}
