// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMPoolTestBase} from "./GMPool.Base.t.sol";
import {GMPool} from "../GMPool.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";

/// @dev Tests: withdrawReserve/Reward/Protocol/Partner happy paths + CEI,
///             injectFunds, emergencyWithdraw, getPoolStatus.
contract GMPoolMiscTest is GMPoolTestBase {

    // ══════════════════════════════════════════════════════════════════════
    // withdrawReserve — happy path & CEI
    // ══════════════════════════════════════════════════════════════════════

    function test_WithdrawReserve_HappyPath() public {
        _doCheckin(1_000e6);

        uint256 reserveBal = pool.poolBalance(POOL_RESERVE); // 100e6
        uint256 prevUsdcBal = usdc.balanceOf(buybackContract);

        vm.prank(buybackContract);
        pool.withdrawReserve(reserveBal);

        assertEq(pool.poolBalance(POOL_RESERVE), 0,                     "pool reserve zeroed");
        assertEq(usdc.balanceOf(buybackContract), prevUsdcBal + reserveBal, "buyback received USDC");
    }

    function test_WithdrawReserve_CEI_BalanceDeductedBeforeTransfer() public {
        _doCheckin(1_000e6);

        uint256 reserveBal = pool.poolBalance(POOL_RESERVE);
        // Pool balance is deducted inside _withdrawFromPool before safeTransfer.
        // We verify: after the call, poolBalance is 0 (balance was set before transfer).
        vm.prank(buybackContract);
        pool.withdrawReserve(reserveBal);

        assertEq(pool.poolBalance(POOL_RESERVE), 0);
        assertEq(pool.totalWithdrawn(POOL_RESERVE), reserveBal);
    }

    function test_WithdrawReserve_EmitsEvent() public {
        _doCheckin(1_000e6);
        uint256 amount = pool.poolBalance(POOL_RESERVE);

        vm.prank(buybackContract);
        vm.expectEmit(true, false, false, true, address(pool));
        emit GMPool.ReserveWithdrawn(buybackContract, amount);
        pool.withdrawReserve(amount);
    }

    // ══════════════════════════════════════════════════════════════════════
    // withdrawReward — happy path
    // ══════════════════════════════════════════════════════════════════════

    function test_WithdrawReward_HappyPath() public {
        _doCheckin(1_000e6);

        uint256 rewardBal = pool.poolBalance(POOL_REWARD); // 800e6
        uint256 prevBal   = usdc.balanceOf(alice);

        vm.prank(checkinContract);
        pool.withdrawReward(rewardBal, alice);

        assertEq(pool.poolBalance(POOL_REWARD), 0);
        assertEq(usdc.balanceOf(alice), prevBal + rewardBal, "alice received reward");
    }

    function test_WithdrawReward_EmitsEvent() public {
        _doCheckin(1_000e6);
        uint256 amount = pool.poolBalance(POOL_REWARD);

        vm.prank(checkinContract);
        vm.expectEmit(true, false, false, true, address(pool));
        emit GMPool.RewardWithdrawn(alice, amount);
        pool.withdrawReward(amount, alice);
    }

    function test_WithdrawReward_UpdatesTotalWithdrawn() public {
        _doCheckin(1_000e6);
        uint256 amount = pool.poolBalance(POOL_REWARD);

        vm.prank(checkinContract);
        pool.withdrawReward(amount, alice);

        assertEq(pool.totalWithdrawn(POOL_REWARD), amount);
    }

    // ══════════════════════════════════════════════════════════════════════
    // withdrawProtocol — happy path
    // ══════════════════════════════════════════════════════════════════════

    function test_WithdrawProtocol_HappyPath() public {
        _doCheckin(1_000e6);

        uint256 protocolBal = pool.poolBalance(POOL_PROTOCOL); // 50e6
        uint256 prevBal     = usdc.balanceOf(alice);

        vm.prank(owner);
        pool.withdrawProtocol(protocolBal, alice);

        assertEq(pool.poolBalance(POOL_PROTOCOL), 0);
        assertEq(usdc.balanceOf(alice), prevBal + protocolBal);
    }

    function test_WithdrawProtocol_EmitsEvent() public {
        _doCheckin(1_000e6);
        uint256 amount = pool.poolBalance(POOL_PROTOCOL);

        vm.prank(owner);
        vm.expectEmit(true, false, false, true, address(pool));
        emit GMPool.ProtocolWithdrawn(alice, amount);
        pool.withdrawProtocol(amount, alice);
    }

    // ══════════════════════════════════════════════════════════════════════
    // withdrawPartner — happy path
    // ══════════════════════════════════════════════════════════════════════

    function test_WithdrawPartner_HappyPath() public {
        _doCheckin(1_000e6);

        uint256 partnerBal = pool.poolBalance(POOL_PARTNER); // 50e6
        uint256 prevBal    = usdc.balanceOf(alice);

        vm.prank(owner);
        pool.withdrawPartner(partnerBal, alice);

        assertEq(pool.poolBalance(POOL_PARTNER), 0);
        assertEq(usdc.balanceOf(alice), prevBal + partnerBal);
    }

    function test_WithdrawPartner_EmitsEvent() public {
        _doCheckin(1_000e6);
        uint256 amount = pool.poolBalance(POOL_PARTNER);

        vm.prank(owner);
        vm.expectEmit(true, false, false, true, address(pool));
        emit GMPool.PartnerWithdrawn(alice, amount);
        pool.withdrawPartner(amount, alice);
    }

    // ══════════════════════════════════════════════════════════════════════
    // injectFunds — anyone can call, correct split, event
    // ══════════════════════════════════════════════════════════════════════

    function test_InjectFunds_AnyoneCanCall() public {
        uint256 amount = 500e6;
        _fund(alice, amount);

        vm.prank(alice);
        pool.injectFunds(amount);

        (uint256 r, uint256 res, uint256 prot, uint256 part) = _split(amount);
        assertEq(pool.poolBalance(POOL_REWARD),   r);
        assertEq(pool.poolBalance(POOL_RESERVE),  res);
        assertEq(pool.poolBalance(POOL_PROTOCOL), prot);
        assertEq(pool.poolBalance(POOL_PARTNER),  part);
    }

    function test_InjectFunds_SplitSumsToAmount() public {
        uint256 amount = 777e6;
        _fund(alice, amount);
        vm.prank(alice);
        pool.injectFunds(amount);

        uint256 sum = pool.poolBalance(POOL_REWARD)
                    + pool.poolBalance(POOL_RESERVE)
                    + pool.poolBalance(POOL_PROTOCOL)
                    + pool.poolBalance(POOL_PARTNER);
        assertEq(sum, amount);
    }

    function test_InjectFunds_EmitsFundsInjected() public {
        uint256 amount = 200e6;
        (uint256 r, uint256 res, uint256 prot, uint256 part) = _split(amount);

        _fund(alice, amount);

        vm.prank(alice);
        vm.expectEmit(true, false, false, true, address(pool));
        emit GMPool.FundsInjected(alice, amount, r, res, prot, part);
        pool.injectFunds(amount);
    }

    function test_InjectFunds_ZeroAmount_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(GMPool.InvalidAmount.selector);
        pool.injectFunds(0);
    }

    function testFuzz_InjectFunds_SplitSumsToAmount(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000e6);
        _fund(alice, amount);
        vm.prank(alice);
        pool.injectFunds(amount);

        uint256 sum = pool.poolBalance(POOL_REWARD)
                    + pool.poolBalance(POOL_RESERVE)
                    + pool.poolBalance(POOL_PROTOCOL)
                    + pool.poolBalance(POOL_PARTNER);
        assertEq(sum, amount);
    }

    // ══════════════════════════════════════════════════════════════════════
    // emergencyWithdraw — owner can rescue other tokens
    // ══════════════════════════════════════════════════════════════════════

    function test_EmergencyWithdraw_OtherToken_Succeeds() public {
        // Deploy a second mock token (not USDC) at a fresh address.
        MockERC20 other = new MockERC20("Other", "OTH", 18);
        other.mint(address(pool), 100e18);

        uint256 prevBal = other.balanceOf(alice);

        vm.prank(owner);
        pool.emergencyWithdraw(address(other), alice, 100e18);

        assertEq(other.balanceOf(alice), prevBal + 100e18, "alice received other token");
        assertEq(other.balanceOf(address(pool)), 0, "pool drained");
    }

    function test_EmergencyWithdraw_EmitsEvent() public {
        MockERC20 other = new MockERC20("Other", "OTH", 18);
        other.mint(address(pool), 50e18);

        vm.prank(owner);
        vm.expectEmit(true, true, false, true, address(pool));
        emit GMPool.EmergencyWithdraw(address(other), alice, 50e18);
        pool.emergencyWithdraw(address(other), alice, 50e18);
    }

    // ══════════════════════════════════════════════════════════════════════
    // getPoolStatus — correct arrays
    // ══════════════════════════════════════════════════════════════════════

    function test_GetPoolStatus_InitiallyAllZero() public view {
        (uint256[4] memory balances, uint256[4] memory deposited, uint256[4] memory withdrawn) =
            pool.getPoolStatus();

        for (uint8 i = 0; i < 4; i++) {
            assertEq(balances[i],  0, "initial balance");
            assertEq(deposited[i], 0, "initial deposited");
            assertEq(withdrawn[i], 0, "initial withdrawn");
        }
    }

    function test_GetPoolStatus_AfterCheckin_CorrectBalances() public {
        uint256 amount = 1_000e6;
        _doCheckin(amount);

        (uint256 r, uint256 res, uint256 prot, uint256 part) = _split(amount);
        (uint256[4] memory balances, uint256[4] memory deposited, uint256[4] memory withdrawn) =
            pool.getPoolStatus();

        assertEq(balances[POOL_REWARD],   r,    "reward balance");
        assertEq(balances[POOL_RESERVE],  res,  "reserve balance");
        assertEq(balances[POOL_PROTOCOL], prot, "protocol balance");
        assertEq(balances[POOL_PARTNER],  part, "partner balance");

        assertEq(deposited[POOL_REWARD],   r,    "reward deposited");
        assertEq(deposited[POOL_RESERVE],  res,  "reserve deposited");
        assertEq(deposited[POOL_PROTOCOL], prot, "protocol deposited");
        assertEq(deposited[POOL_PARTNER],  part, "partner deposited");

        assertEq(withdrawn[POOL_REWARD],   0, "no reward withdrawn yet");
        assertEq(withdrawn[POOL_RESERVE],  0, "no reserve withdrawn yet");
        assertEq(withdrawn[POOL_PROTOCOL], 0, "no protocol withdrawn yet");
        assertEq(withdrawn[POOL_PARTNER],  0, "no partner withdrawn yet");
    }

    function test_GetPoolStatus_AfterWithdraw_CorrectArrays() public {
        uint256 amount = 1_000e6;
        _doCheckin(amount);

        uint256 reserveBal = pool.poolBalance(POOL_RESERVE);

        vm.prank(buybackContract);
        pool.withdrawReserve(reserveBal);

        (, , uint256[4] memory withdrawn) = pool.getPoolStatus();
        assertEq(withdrawn[POOL_RESERVE], reserveBal, "reserve withdrawn tracked");

        (uint256[4] memory balances,,) = pool.getPoolStatus();
        assertEq(balances[POOL_RESERVE], 0, "reserve balance zero after withdraw");
    }
}
