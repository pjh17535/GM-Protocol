// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMBuybackTestBase} from "./GMBuyback.Base.t.sol";
import {GMBuyback} from "../GMBuyback.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @dev Tests: setAuthorizedCaller, buybackAndBurn, self-funded executeBuyback/canExecute,
///      renounceOwnership-while-paused guard.
contract GMBuybackAuthorizedTest is GMBuybackTestBase {
    uint256 internal constant GARC_RATE = 2_000e18;

    function setUp() public override {
        super.setUp();
        vm.prank(owner);
        buyback.setAuthorizedCaller(caller1, true);
    }

    function _give(address who, uint256 amount) internal {
        usdc.mint(who, amount);
        vm.prank(who);
        usdc.approve(address(buyback), amount);
    }

    // ── setAuthorizedCaller ───────────────────────────────────────────────

    function test_SetAuthorizedCaller_OwnerCanAuthorizeAndRevoke() public {
        assertTrue(buyback.authorizedCallers(caller1));
        vm.prank(owner);
        buyback.setAuthorizedCaller(caller1, false);
        assertFalse(buyback.authorizedCallers(caller1));
    }

    function test_SetAuthorizedCaller_EmitsEvent() public {
        vm.expectEmit(true, false, false, true, address(buyback));
        emit GMBuyback.AuthorizedCallerUpdated(bob, true);
        vm.prank(owner);
        buyback.setAuthorizedCaller(bob, true);
    }

    function test_SetAuthorizedCaller_RevertsForNonOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        buyback.setAuthorizedCaller(bob, true);
    }

    function test_SetAuthorizedCaller_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(GMBuyback.ZeroAddress.selector);
        buyback.setAuthorizedCaller(address(0), true);
    }

    // ── buybackAndBurn: happy path ────────────────────────────────────────

    function test_BuybackAndBurn_PullsUsdcSwapsAndBurns() public {
        uint256 amt = 7e6;
        _give(caller1, amt);

        vm.prank(caller1);
        uint256 burned = buyback.buybackAndBurn(amt);

        uint256 expected = (amt * GARC_RATE) / 1e6;
        assertEq(burned, expected, "return value is burned gARC");
        assertEq(usdc.balanceOf(caller1), 0, "caller USDC pulled");
        assertEq(usdc.balanceOf(address(buyback)), 0, "no USDC left in buyback");
        assertEq(garc.balanceOf(address(buyback)), 0, "no gARC left in buyback");
        assertEq(garc.totalSupply(), 0, "all swapped gARC burned");
        assertEq(usdc.balanceOf(ROUTER_ADDR), amt, "router received exactly amt");
    }

    function test_BuybackAndBurn_UpdatesCountersButNotCooldownClock() public {
        _give(caller1, 3e6);
        vm.prank(caller1);
        buyback.buybackAndBurn(3e6);

        assertEq(buyback.totalUsdcUsed(), 3e6);
        assertEq(buyback.totalGarcBurned(), (3e6 * GARC_RATE) / 1e6);
        assertEq(buyback.triggerCount(), 1);
        assertEq(buyback.lastBuybackTime(), 0, "does not touch lastBuybackTime");
    }

    function test_BuybackAndBurn_NoCooldownBetweenCalls() public {
        _give(caller1, 2e6);
        vm.startPrank(caller1);
        buyback.buybackAndBurn(1e6);
        buyback.buybackAndBurn(1e6);
        vm.stopPrank();
        assertEq(buyback.triggerCount(), 2);
        assertEq(buyback.totalUsdcUsed(), 2e6);
    }

    function test_BuybackAndBurn_NoIncentivePaidToCaller() public {
        // Caller supplies exactly `amt`; ends with zero — no refund/incentive.
        _give(caller1, 5e6);
        vm.prank(caller1);
        buyback.buybackAndBurn(5e6);
        assertEq(usdc.balanceOf(caller1), 0);
    }

    function test_BuybackAndBurn_NotSubjectToMinOrMaxSingleBuyback() public {
        // below min (1e6) and above max (10e6) both allowed
        _give(caller1, 100e6 + 1);
        vm.startPrank(caller1);
        buyback.buybackAndBurn(1);
        buyback.buybackAndBurn(100e6);
        vm.stopPrank();
        assertEq(buyback.totalUsdcUsed(), 100e6 + 1);
    }

    function test_BuybackAndBurn_DoesNotSpendContractOwnBalance() public {
        _fundVault(4e6); // pre-existing balance in buyback
        _give(caller1, 2e6);
        vm.prank(caller1);
        buyback.buybackAndBurn(2e6);
        assertEq(usdc.balanceOf(address(buyback)), 4e6, "own balance untouched");
    }

    function test_BuybackAndBurn_EmitsBuybackExecuted() public {
        _give(caller1, 2e6);
        uint256 burned = (2e6 * GARC_RATE) / 1e6;
        vm.expectEmit(true, false, false, true, address(buyback));
        emit GMBuyback.BuybackExecuted(caller1, 2e6, 0, 2e6, burned, block.timestamp);
        vm.prank(caller1);
        buyback.buybackAndBurn(2e6);
    }

    function testFuzz_BuybackAndBurn_ConservesAndBurnsExactly(uint256 amt) public {
        amt = bound(amt, 1, 1e12);
        _give(caller1, amt);
        vm.prank(caller1);
        uint256 burned = buyback.buybackAndBurn(amt);
        assertEq(burned, (amt * GARC_RATE) / 1e6);
        assertEq(usdc.balanceOf(caller1), 0);
        assertEq(usdc.balanceOf(address(buyback)), 0);
        assertEq(garc.balanceOf(address(buyback)), 0);
        assertEq(buyback.totalGarcBurned(), burned);
    }

    // ── buybackAndBurn: reverts ───────────────────────────────────────────

    function test_BuybackAndBurn_RevertsForUnauthorizedCaller() public {
        _give(alice, 1e6);
        vm.prank(alice);
        vm.expectRevert(GMBuyback.NotAuthorized.selector);
        buyback.buybackAndBurn(1e6);
    }

    function test_BuybackAndBurn_OwnerIsNotImplicitlyAuthorized() public {
        _give(owner, 1e6);
        vm.prank(owner);
        vm.expectRevert(GMBuyback.NotAuthorized.selector);
        buyback.buybackAndBurn(1e6);
    }

    function test_BuybackAndBurn_RevertsAfterAuthorizationRevoked() public {
        vm.prank(owner);
        buyback.setAuthorizedCaller(caller1, false);
        _give(caller1, 1e6);
        vm.prank(caller1);
        vm.expectRevert(GMBuyback.NotAuthorized.selector);
        buyback.buybackAndBurn(1e6);
    }

    function test_BuybackAndBurn_RevertsOnZeroAmount() public {
        vm.prank(caller1);
        vm.expectRevert(GMBuyback.ZeroSwapAmount.selector);
        buyback.buybackAndBurn(0);
    }

    function test_BuybackAndBurn_RevertsWhenPaused() public {
        _give(caller1, 1e6);
        vm.prank(owner);
        buyback.pause();
        vm.prank(caller1);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        buyback.buybackAndBurn(1e6);
    }

    function test_BuybackAndBurn_RevertsWithoutAllowance() public {
        usdc.mint(caller1, 1e6); // no approval
        vm.prank(caller1);
        vm.expectRevert();
        buyback.buybackAndBurn(1e6);
        assertEq(usdc.balanceOf(caller1), 1e6, "funds untouched");
    }

    function test_BuybackAndBurn_SwapFailureRevertsAndKeepsFunds() public {
        _give(caller1, 3e6);
        router.setMode(1);
        vm.prank(caller1);
        vm.expectRevert("MockRouter: swap failed");
        buyback.buybackAndBurn(3e6);
        assertEq(usdc.balanceOf(caller1), 3e6);
        assertEq(usdc.balanceOf(address(buyback)), 0);
        assertEq(buyback.triggerCount(), 0);
    }

    function test_BuybackAndBurn_RevertsOnZeroQuote() public {
        _give(caller1, 3e6);
        router.setMode(2);
        vm.prank(caller1);
        vm.expectRevert(GMBuyback.InvalidSwapQuote.selector);
        buyback.buybackAndBurn(3e6);
    }

    function test_BuybackAndBurn_RevertsWhenSwapDeliversZeroGarc() public {
        _give(caller1, 3e6);
        router.setMode(3);
        vm.prank(caller1);
        vm.expectRevert(GMBuyback.ZeroBurnAmount.selector);
        buyback.buybackAndBurn(3e6);
    }

    // ── executeBuyback / canExecute spend the contract's own USDC ─────────

    function test_ExecuteBuyback_SpendsOwnBalance() public {
        _fundVault(6e6);
        vm.prank(owner);
        buyback.executeBuyback();
        assertEq(usdc.balanceOf(address(buyback)), 0);
        assertEq(buyback.totalUsdcUsed(), 6e6);
        assertEq(garc.balanceOf(address(buyback)), 0);
    }

    function test_ExecuteBuyback_LeavesRemainderAboveMaxSingle() public {
        _fundVault(25e6);
        vm.prank(owner);
        buyback.executeBuyback();
        assertEq(usdc.balanceOf(address(buyback)), 15e6);
    }

    function test_ExecuteBuyback_PicksUpUsdcSentDirectlyByPartner() public {
        // GMPartner transfers its buyback share straight to this contract.
        usdc.mint(alice, 2e6);
        vm.prank(alice);
        usdc.transfer(address(buyback), 2e6);
        assertTrue(buyback.canExecute());
        vm.prank(bob);
        buyback.executeBuyback();
        assertEq(buyback.totalUsdcUsed(), 2e6);
    }

    function test_CanExecute_FalseWhenOwnBalanceBelowMin() public {
        _fundVault(1e6 - 1);
        assertFalse(buyback.canExecute());
        usdc.mint(address(buyback), 1);
        assertTrue(buyback.canExecute());
    }

    // ── renounceOwnership ─────────────────────────────────────────────────

    function test_RenounceOwnership_AlwaysRevertsForOwner_NotPaused() public {
        vm.prank(owner);
        vm.expectRevert(GMBuyback.RenounceDisabled.selector);
        buyback.renounceOwnership();
        assertEq(buyback.owner(), owner);
    }

    function test_RenounceOwnership_AlwaysRevertsForOwner_Paused() public {
        vm.startPrank(owner);
        buyback.pause();
        vm.expectRevert(GMBuyback.RenounceDisabled.selector);
        buyback.renounceOwnership();
        vm.stopPrank();
        assertEq(buyback.owner(), owner);
    }

    function test_RenounceOwnership_NonOwnerRevertsViaOnlyOwnerFirst() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        buyback.renounceOwnership();
    }

    // ── canExecute while paused ───────────────────────────────────────────

    function test_CanExecute_FalseWhilePaused() public {
        _fundVault(5e6);
        assertTrue(buyback.canExecute());
        vm.prank(owner);
        buyback.pause();
        assertFalse(buyback.canExecute());
        vm.prank(owner);
        buyback.unpause();
        assertTrue(buyback.canExecute());
    }

    // ── Ownable2Step ──────────────────────────────────────────────────────

    function test_TransferOwnership_OnlySetsPendingOwner() public {
        vm.expectEmit(true, true, false, false, address(buyback));
        emit Ownable2Step.OwnershipTransferStarted(owner, alice);
        vm.prank(owner);
        buyback.transferOwnership(alice);
        assertEq(buyback.owner(), owner, "owner unchanged");
        assertEq(buyback.pendingOwner(), alice);

        // pending owner has no privileges yet
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        buyback.pause();
    }

    function test_TransferOwnership_NonOwnerReverts() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        buyback.transferOwnership(alice);
    }

    function test_AcceptOwnership_ByPendingOwnerCompletesTransfer() public {
        vm.prank(owner);
        buyback.transferOwnership(alice);

        vm.expectEmit(true, true, false, false, address(buyback));
        emit Ownable.OwnershipTransferred(owner, alice);
        vm.prank(alice);
        buyback.acceptOwnership();

        assertEq(buyback.owner(), alice);
        assertEq(buyback.pendingOwner(), address(0));

        // old owner lost privileges, new owner has them
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, owner));
        buyback.pause();
        vm.prank(alice);
        buyback.pause();
        assertTrue(buyback.paused());
    }

    function test_AcceptOwnership_ByNonPendingReverts() public {
        vm.prank(owner);
        buyback.transferOwnership(alice);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, bob));
        buyback.acceptOwnership();
        assertEq(buyback.owner(), owner);
    }
}
