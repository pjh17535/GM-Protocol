// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMPoolTestBase} from "./GMPool.Base.t.sol";
import {GMPool} from "../GMPool.sol";

/// @dev Tests: setGTotal, executeQuarterlyInjection, getNextQuarterlyAmount.
contract GMPoolQuarterlyTest is GMPoolTestBase {

    // ══════════════════════════════════════════════════════════════════════
    // setGTotal — happy path
    // ══════════════════════════════════════════════════════════════════════

    function test_SetGTotal_HappyPath() public {
        vm.prank(owner);
        pool.setGTotal(G_TOTAL);

        assertEq(pool.gTotal(), G_TOTAL);
        assertTrue(pool.gTotalSet());
    }

    function test_SetGTotal_EmitsEvent() public {
        vm.prank(owner);
        vm.expectEmit(false, false, false, true, address(pool));
        emit GMPool.GTotalSet(G_TOTAL);
        pool.setGTotal(G_TOTAL);
    }

    // ══════════════════════════════════════════════════════════════════════
    // getNextQuarterlyAmount — before gTotal set
    // ══════════════════════════════════════════════════════════════════════

    function test_GetNextQuarterlyAmount_GTotalNotSet_ReturnsZeroZero() public view {
        (uint256 quarter, uint256 expected) = pool.getNextQuarterlyAmount();
        assertEq(quarter,  0);
        assertEq(expected, 0);
    }

    // ══════════════════════════════════════════════════════════════════════
    // getNextQuarterlyAmount — after gTotal set
    // ══════════════════════════════════════════════════════════════════════

    function test_GetNextQuarterlyAmount_Q1_CorrectValues() public {
        vm.prank(owner);
        pool.setGTotal(G_TOTAL);

        (uint256 quarter, uint256 expected) = pool.getNextQuarterlyAmount();
        assertEq(quarter, 1);
        // Q1: gTotal * (49 - 2*1) / 576 = gTotal * 47 / 576
        assertEq(expected, (G_TOTAL * 47) / 576);
    }

    function test_GetNextQuarterlyAmount_AfterFirstInjection_ShowsQ2() public {
        vm.prank(owner);
        pool.setGTotal(G_TOTAL);

        uint256 q1Amount = (G_TOTAL * 47) / 576;
        _fund(owner, q1Amount);
        vm.prank(owner);
        pool.executeQuarterlyInjection(q1Amount);

        (uint256 quarter, uint256 expected) = pool.getNextQuarterlyAmount();
        assertEq(quarter, 2);
        // Q2: gTotal * (49 - 4) / 576 = gTotal * 45 / 576
        assertEq(expected, (G_TOTAL * 45) / 576);
    }

    // ══════════════════════════════════════════════════════════════════════
    // executeQuarterlyInjection — Q1 correct amount and state
    // ══════════════════════════════════════════════════════════════════════

    function test_ExecuteQuarterly_Q1_CorrectAmount() public {
        vm.prank(owner);
        pool.setGTotal(G_TOTAL);

        uint256 q1Amount = (G_TOTAL * 47) / 576;
        _fund(owner, q1Amount);

        vm.prank(owner);
        pool.executeQuarterlyInjection(q1Amount);

        assertEq(pool.quarterlyInjectionCount(), 1);
        assertEq(pool.lastQuarterlyInjection(), START_TS);
    }

    function test_ExecuteQuarterly_Q1_SplitsPoolsCorrectly() public {
        vm.prank(owner);
        pool.setGTotal(G_TOTAL);

        uint256 q1Amount = (G_TOTAL * 47) / 576;
        _fund(owner, q1Amount);

        vm.prank(owner);
        pool.executeQuarterlyInjection(q1Amount);

        (uint256 r, uint256 res, uint256 prot, uint256 part) = _split(q1Amount);
        assertEq(pool.poolBalance(POOL_REWARD),   r);
        assertEq(pool.poolBalance(POOL_RESERVE),  res);
        assertEq(pool.poolBalance(POOL_PROTOCOL), prot);
        assertEq(pool.poolBalance(POOL_PARTNER),  part);
    }

    function test_ExecuteQuarterly_Q1_EmitsEvent() public {
        vm.prank(owner);
        pool.setGTotal(G_TOTAL);

        uint256 q1Amount = (G_TOTAL * 47) / 576;
        uint256 expected = (G_TOTAL * 47) / 576;
        _fund(owner, q1Amount);

        vm.prank(owner);
        vm.expectEmit(true, false, false, true, address(pool));
        emit GMPool.QuarterlyInjectionExecuted(1, q1Amount, expected, START_TS);
        pool.executeQuarterlyInjection(q1Amount);
    }

    // ══════════════════════════════════════════════════════════════════════
    // executeQuarterlyInjection — tolerances (95% / 105%)
    // ══════════════════════════════════════════════════════════════════════

    function test_ExecuteQuarterly_AtMinTolerance_Succeeds() public {
        vm.prank(owner);
        pool.setGTotal(G_TOTAL);

        uint256 expected = (G_TOTAL * 47) / 576;
        uint256 minAllowed = (expected * 95) / 100;
        _fund(owner, minAllowed);

        vm.prank(owner);
        pool.executeQuarterlyInjection(minAllowed);

        assertEq(pool.quarterlyInjectionCount(), 1);
    }

    function test_ExecuteQuarterly_AtMaxTolerance_Succeeds() public {
        vm.prank(owner);
        pool.setGTotal(G_TOTAL);

        uint256 expected = (G_TOTAL * 47) / 576;
        uint256 maxAllowed = (expected * 105) / 100;
        _fund(owner, maxAllowed);

        vm.prank(owner);
        pool.executeQuarterlyInjection(maxAllowed);

        assertEq(pool.quarterlyInjectionCount(), 1);
    }

    // ══════════════════════════════════════════════════════════════════════
    // executeQuarterlyInjection — 90-day time gate
    // ══════════════════════════════════════════════════════════════════════

    function test_ExecuteQuarterly_SecondInjectionTooSoon_Reverts() public {
        vm.prank(owner);
        pool.setGTotal(G_TOTAL);

        // First injection
        uint256 q1Amount = (G_TOTAL * 47) / 576;
        _fund(owner, q1Amount);
        vm.prank(owner);
        pool.executeQuarterlyInjection(q1Amount);

        // Attempt second injection immediately (no time warp)
        uint256 q2Amount = (G_TOTAL * 45) / 576;
        _fund(owner, q2Amount);

        uint256 nextAllowed = START_TS + 90 days;
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(GMPool.QuarterlyInjectionTooSoon.selector, nextAllowed)
        );
        pool.executeQuarterlyInjection(q2Amount);
    }

    function test_ExecuteQuarterly_SecondInjectionAfter90Days_Succeeds() public {
        vm.prank(owner);
        pool.setGTotal(G_TOTAL);

        // First injection
        uint256 q1Amount = (G_TOTAL * 47) / 576;
        _fund(owner, q1Amount);
        vm.prank(owner);
        pool.executeQuarterlyInjection(q1Amount);

        // Advance exactly 90 days
        vm.warp(START_TS + 90 days);

        uint256 q2Amount = (G_TOTAL * 45) / 576;
        _fund(owner, q2Amount);
        vm.prank(owner);
        pool.executeQuarterlyInjection(q2Amount);

        assertEq(pool.quarterlyInjectionCount(), 2);
    }

    // ══════════════════════════════════════════════════════════════════════
    // executeQuarterlyInjection — 24-quarter limit
    // ══════════════════════════════════════════════════════════════════════

    function test_ExecuteQuarterly_After24Quarters_Reverts() public {
        vm.prank(owner);
        pool.setGTotal(G_TOTAL);

        // Execute all 24 quarters
        for (uint256 i = 0; i < 24; i++) {
            uint256 qNum    = i + 1;
            uint256 qAmount = (G_TOTAL * (49 - 2 * qNum)) / 576;
            _fund(owner, qAmount);
            vm.prank(owner);
            pool.executeQuarterlyInjection(qAmount);

            if (i < 23) {
                vm.warp(block.timestamp + 90 days);
            }
        }

        assertEq(pool.quarterlyInjectionCount(), 24);

        // 25th injection must revert
        vm.prank(owner);
        vm.expectRevert(GMPool.QuarterlyInjectionLimitReached.selector);
        pool.executeQuarterlyInjection(1e6);
    }

    function test_GetNextQuarterlyAmount_After24Quarters_ReturnsZeroZero() public {
        vm.prank(owner);
        pool.setGTotal(G_TOTAL);

        for (uint256 i = 0; i < 24; i++) {
            uint256 qNum    = i + 1;
            uint256 qAmount = (G_TOTAL * (49 - 2 * qNum)) / 576;
            _fund(owner, qAmount);
            vm.prank(owner);
            pool.executeQuarterlyInjection(qAmount);
            if (i < 23) {
                vm.warp(block.timestamp + 90 days);
            }
        }

        (uint256 quarter, uint256 expected) = pool.getNextQuarterlyAmount();
        assertEq(quarter,  0);
        assertEq(expected, 0);
    }
}
