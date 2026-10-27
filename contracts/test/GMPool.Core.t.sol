// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMPoolTestBase} from "./GMPool.Base.t.sol";
import {GMPool} from "../GMPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @dev Tests: deploy/init, receiveCheckinFee happy paths (split, counters, events).
contract GMPoolCoreTest is GMPoolTestBase {

    // ══════════════════════════════════════════════════════════════════════
    // Deployment & initialisation
    // ══════════════════════════════════════════════════════════════════════

    function test_Deploy_OwnerSet() public view {
        assertEq(pool.owner(), owner);
    }

    function test_Deploy_CheckinContractSet() public view {
        assertEq(pool.checkinContract(), checkinContract);
    }

    function test_Deploy_BuybackContractSet() public view {
        assertEq(pool.buybackContract(), buybackContract);
    }

    function test_Deploy_AllBalancesZero() public view {
        assertEq(pool.poolBalance(POOL_REWARD),   0);
        assertEq(pool.poolBalance(POOL_RESERVE),  0);
        assertEq(pool.poolBalance(POOL_PROTOCOL), 0);
        assertEq(pool.poolBalance(POOL_PARTNER),  0);
    }

    function test_Deploy_GTotalZero_NotSet() public view {
        assertEq(pool.gTotal(),    0);
        assertFalse(pool.gTotalSet());
    }

    function test_Deploy_WithGTotal_SetsFlag() public {
        GMPool p2 = new GMPool(owner, G_TOTAL);
        assertEq(p2.gTotal(), G_TOTAL);
        assertTrue(p2.gTotalSet());
    }

    function test_Deploy_TotalCheckinsZero() public view {
        assertEq(pool.totalCheckins(), 0);
    }

    // ══════════════════════════════════════════════════════════════════════
    // receiveCheckinFee — access control
    // ══════════════════════════════════════════════════════════════════════

    function test_ReceiveCheckinFee_OnlyCheckinContract_Reverts() public {
        _fund(alice, 100e6);
        vm.prank(alice);
        vm.expectRevert(GMPool.Unauthorized.selector);
        pool.receiveCheckinFee(100e6);
    }

    function test_ReceiveCheckinFee_OwnerReverts() public {
        _fund(owner, 100e6);
        vm.prank(owner);
        vm.expectRevert(GMPool.Unauthorized.selector);
        pool.receiveCheckinFee(100e6);
    }

    // ══════════════════════════════════════════════════════════════════════
    // receiveCheckinFee — 80/10/5/5 split (round amount — no dust)
    // ══════════════════════════════════════════════════════════════════════

    function test_ReceiveCheckinFee_Split_RoundAmount() public {
        uint256 amount = 1_000e6; // 1000 USDC — perfectly divisible
        _doCheckin(amount);

        (uint256 r, uint256 res, uint256 prot, uint256 part) = _split(amount);

        assertEq(pool.poolBalance(POOL_REWARD),   r,    "reward balance");
        assertEq(pool.poolBalance(POOL_RESERVE),  res,  "reserve balance");
        assertEq(pool.poolBalance(POOL_PROTOCOL), prot, "protocol balance");
        assertEq(pool.poolBalance(POOL_PARTNER),  part, "partner balance");

        // Verify BPS values directly
        assertEq(r,    800e6);
        assertEq(res,  100e6);
        assertEq(prot,  50e6);
        assertEq(part,  50e6);
    }

    function test_ReceiveCheckinFee_Split_DustGoesToReward() public {
        // 1 wei — dust calculation: reward=0, reserve=0, protocol=0, partner=0, dust=1 → reward=1
        uint256 amount = 1;
        _doCheckin(amount);

        assertEq(pool.poolBalance(POOL_REWARD),   1, "all dust to reward");
        assertEq(pool.poolBalance(POOL_RESERVE),  0);
        assertEq(pool.poolBalance(POOL_PROTOCOL), 0);
        assertEq(pool.poolBalance(POOL_PARTNER),  0);
    }

    function test_ReceiveCheckinFee_Split_OddAmount() public {
        // 3 USDC (3e6) — not evenly divisible
        uint256 amount = 3e6;
        _doCheckin(amount);

        (uint256 r, uint256 res, uint256 prot, uint256 part) = _split(amount);

        assertEq(pool.poolBalance(POOL_REWARD),   r);
        assertEq(pool.poolBalance(POOL_RESERVE),  res);
        assertEq(pool.poolBalance(POOL_PROTOCOL), prot);
        assertEq(pool.poolBalance(POOL_PARTNER),  part);

        // Sum of all pool balances must equal original amount
        uint256 sum = pool.poolBalance(POOL_REWARD) + pool.poolBalance(POOL_RESERVE)
                    + pool.poolBalance(POOL_PROTOCOL) + pool.poolBalance(POOL_PARTNER);
        assertEq(sum, amount, "total split must equal amount");
    }

    // ══════════════════════════════════════════════════════════════════════
    // receiveCheckinFee — counters & totalDeposited
    // ══════════════════════════════════════════════════════════════════════

    function test_ReceiveCheckinFee_IncrementsTotalCheckins() public {
        _doCheckin(100e6);
        assertEq(pool.totalCheckins(), 1);
        _doCheckin(100e6);
        assertEq(pool.totalCheckins(), 2);
    }

    function test_ReceiveCheckinFee_UpdatesTotalDeposited() public {
        uint256 amount = 500e6;
        _doCheckin(amount);

        (uint256 r, uint256 res, uint256 prot, uint256 part) = _split(amount);

        assertEq(pool.totalDeposited(POOL_REWARD),   r);
        assertEq(pool.totalDeposited(POOL_RESERVE),  res);
        assertEq(pool.totalDeposited(POOL_PROTOCOL), prot);
        assertEq(pool.totalDeposited(POOL_PARTNER),  part);
    }

    function test_ReceiveCheckinFee_AccumulatesAcrossMultipleCalls() public {
        _doCheckin(100e6);
        _doCheckin(200e6);

        assertEq(pool.totalCheckins(), 2);

        uint256 totalAmount = 300e6;
        (uint256 r, uint256 res, uint256 prot, uint256 part) = _split(totalAmount);

        assertEq(pool.poolBalance(POOL_REWARD),   r);
        assertEq(pool.poolBalance(POOL_RESERVE),  res);
        assertEq(pool.poolBalance(POOL_PROTOCOL), prot);
        assertEq(pool.poolBalance(POOL_PARTNER),  part);
    }

    // ══════════════════════════════════════════════════════════════════════
    // receiveCheckinFee — event
    // ══════════════════════════════════════════════════════════════════════

    function test_ReceiveCheckinFee_EmitsEvent() public {
        uint256 amount = 1_000e6;
        (uint256 r, uint256 res, uint256 prot, uint256 part) = _split(amount);

        _fund(checkinContract, amount);

        vm.prank(checkinContract);
        vm.expectEmit(false, false, false, true, address(pool));
        emit GMPool.CheckinFeeReceived(amount, r, res, prot, part);
        pool.receiveCheckinFee(amount);
    }

    function test_ReceiveCheckinFee_EmitsEvent_OddAmount() public {
        uint256 amount = 7e6;
        (uint256 r, uint256 res, uint256 prot, uint256 part) = _split(amount);

        _fund(checkinContract, amount);

        vm.prank(checkinContract);
        vm.expectEmit(false, false, false, true, address(pool));
        emit GMPool.CheckinFeeReceived(amount, r, res, prot, part);
        pool.receiveCheckinFee(amount);
    }

    // ══════════════════════════════════════════════════════════════════════
    // receiveCheckinFee — fuzz: split always sums to amount
    // ══════════════════════════════════════════════════════════════════════

    function testFuzz_ReceiveCheckinFee_SplitSumsToAmount(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000e6);
        _doCheckin(amount);

        uint256 sum = pool.poolBalance(POOL_REWARD)
                    + pool.poolBalance(POOL_RESERVE)
                    + pool.poolBalance(POOL_PROTOCOL)
                    + pool.poolBalance(POOL_PARTNER);
        assertEq(sum, amount, "split must sum to full amount");
    }
}
