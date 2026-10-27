// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMBuybackTestBase} from "./GMBuyback.Base.t.sol";
import {GMBuyback} from "../GMBuyback.sol";

/// @dev Tests: caller incentive calculations, owner-gets-no-incentive,
///             gARC burn, state updates, BuybackExecuted event.
contract GMBuybackIncentiveTest is GMBuybackTestBase {

    /// @dev Mirrors MockUniswapV2Router.GARC_OUT_PER_USDC — baked into the mock bytecode.
    uint256 internal constant GARC_RATE = 2_000e18;

    // ══════════════════════════════════════════════════════════════════════
    //  Caller incentive — base rate (first call, 1 period elapsed)
    // ══════════════════════════════════════════════════════════════════════

    function test_CallerIncentive_BaseRateFirstCall() public {
        // After exactly 1 cooldown period: periodsElapsed = 1,
        // incentiveBps = baseIncentiveBps * (1 + 1) = 10 * 2 = 20 bps.
        // But at time 0 lastBuybackTime=0, and elapsed = START_TS = 1_000_000,
        // periodsElapsed = 1_000_000 / 1800 = 555, so it's already capped at maxIncentiveBps=100.
        //
        // To test base rate on the very first call we must artificially cap elapsed
        // to exactly 1 period. We do this by warping lastBuybackTime forward first:
        // set lastBuybackTime to START_TS - 1*cooldown so elapsed == 1 period.
        //
        // We achieve this by executing a dummy buyback then advancing 1 period.
        _fundVault(DEFAULT_MAX);
        // Execute once (sets lastBuybackTime = block.timestamp).
        vm.prank(alice);
        buyback.executeBuyback();

        // Advance exactly 1 cooldown period.
        vm.warp(block.timestamp + DEFAULT_COOLDOWN);

        // expected: periodsElapsed=1, incentiveBps = 10*(1+1)=20
        uint256 buybackAmount = DEFAULT_MAX; // vault will be refunded
        uint256 expectedBps    = 20;
        uint256 expectedIncentive = (buybackAmount * expectedBps) / BPS_DENOM;

        _fundVault(DEFAULT_MAX);
        uint256 aliceBalBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        buyback.executeBuyback();
        uint256 aliceBalAfter = usdc.balanceOf(alice);

        assertEq(aliceBalAfter - aliceBalBefore, expectedIncentive,
            "caller incentive should be 20bps of buybackAmount at 1 period elapsed");
    }

    function test_CallerIncentive_EscalatesAfterMultiplePeriods() public {
        // After 3 periods: periodsElapsed=3, incentiveBps = 10*(3+1)=40 bps.
        _fundVault(DEFAULT_MAX);
        vm.prank(alice);
        buyback.executeBuyback();

        vm.warp(block.timestamp + DEFAULT_COOLDOWN * 3);

        uint256 expectedBps       = 40; // 10 * (3+1)
        uint256 buybackAmount     = DEFAULT_MAX;
        uint256 expectedIncentive = (buybackAmount * expectedBps) / BPS_DENOM;

        _fundVault(DEFAULT_MAX);
        uint256 aliceBalBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        buyback.executeBuyback();
        uint256 aliceBalAfter = usdc.balanceOf(alice);

        assertEq(aliceBalAfter - aliceBalBefore, expectedIncentive,
            "caller incentive escalates with periods elapsed");
    }

    function test_CallerIncentive_CapsAtMaxIncentiveBps() public {
        // After 10 periods: periodsElapsed=10, incentiveBps = 10*(10+1)=110 > maxIncentiveBps=100 → capped at 100.
        _fundVault(DEFAULT_MAX);
        vm.prank(alice);
        buyback.executeBuyback();

        vm.warp(block.timestamp + DEFAULT_COOLDOWN * 10);

        uint256 expectedBps       = MAX_BPS; // capped
        uint256 buybackAmount     = DEFAULT_MAX;
        uint256 expectedIncentive = (buybackAmount * expectedBps) / BPS_DENOM;

        _fundVault(DEFAULT_MAX);
        uint256 aliceBalBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        buyback.executeBuyback();
        uint256 aliceBalAfter = usdc.balanceOf(alice);

        assertEq(aliceBalAfter - aliceBalBefore, expectedIncentive,
            "caller incentive must not exceed maxIncentiveBps");
    }

    // ══════════════════════════════════════════════════════════════════════
    //  Owner gets no incentive
    // ══════════════════════════════════════════════════════════════════════

    function test_OwnerGetsNoIncentive() public {
        _fundVault(DEFAULT_MAX);

        uint256 ownerBalBefore = usdc.balanceOf(owner);
        vm.prank(owner);
        buyback.executeBuyback();
        uint256 ownerBalAfter = usdc.balanceOf(owner);

        assertEq(ownerBalAfter, ownerBalBefore, "owner should receive zero incentive");
    }

    // ══════════════════════════════════════════════════════════════════════
    //  getCurrentIncentiveBps — view function
    // ══════════════════════════════════════════════════════════════════════

    function test_GetCurrentIncentiveBps_ReturnsCorrectEscalatedValue() public {
        // At START_TS, lastBuybackTime=0.
        // elapsed = START_TS = 1_000_000; periodsElapsed = 1_000_000/1800 = 555
        // 10*(555+1) = 5560 > 100 → capped at 100.
        assertEq(buyback.getCurrentIncentiveBps(), MAX_BPS,
            "should return maxIncentiveBps when many periods elapsed");
    }

    function test_GetCurrentIncentiveBps_ExactlyOnePeriod() public {
        // Execute buyback to reset lastBuybackTime, then advance 1 period.
        _fundVault(DEFAULT_MAX);
        vm.prank(alice);
        buyback.executeBuyback();

        vm.warp(block.timestamp + DEFAULT_COOLDOWN);
        // periodsElapsed = 1; bps = 10*(1+1) = 20
        assertEq(buyback.getCurrentIncentiveBps(), 20);
    }

    function test_GetCurrentIncentiveBps_TwoPeriods() public {
        _fundVault(DEFAULT_MAX);
        vm.prank(alice);
        buyback.executeBuyback();

        vm.warp(block.timestamp + DEFAULT_COOLDOWN * 2);
        // periodsElapsed = 2; bps = 10*(2+1) = 30
        assertEq(buyback.getCurrentIncentiveBps(), 30);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  gARC burn — balance decreases after buyback
    // ══════════════════════════════════════════════════════════════════════

    function test_GarcIsBurnedAfterSwap() public {
        _fundVault(DEFAULT_MAX);

        uint256 swapAmount = DEFAULT_MAX; // owner caller → incentive = 0
        // router mints garcOut = swapAmount * 2000e18 / 1e6 = 10e6 * 2000e18 / 1e6 = 20_000e18
        uint256 expectedGarcBurned = (swapAmount * GARC_RATE) / 1e6;

        // Pre-seed gARC supply at a sentinel address so totalSupply starts non-zero.
        // This lets us verify the net supply change is negative (i.e. burn > 0).
        garc.mint(address(0xdead), expectedGarcBurned * 10);
        uint256 totalSupplyBefore = garc.totalSupply(); // expectedGarcBurned * 10

        vm.prank(owner);
        buyback.executeBuyback();
        uint256 totalSupplyAfter = garc.totalSupply();

        // The router minted expectedGarcBurned into GMBuyback, then GMBuyback burned it.
        // Net change on totalSupply = mint - burn = 0 (they cancel out exactly).
        // The observable properties are:
        //  1. GMBuyback holds 0 gARC (it burned everything it received).
        //  2. totalGarcBurned state var records the correct amount.
        assertEq(garc.balanceOf(address(buyback)), 0,
            "buyback contract should hold zero gARC after burn");
        assertEq(buyback.totalGarcBurned(), expectedGarcBurned,
            "totalGarcBurned should equal the amount received from the swap");
        // Net supply: router-mint and contract-burn cancel → supply unchanged vs. before.
        assertEq(totalSupplyAfter, totalSupplyBefore,
            "net gARC supply unchanged: mint from swap == burn by contract");
    }

    // ══════════════════════════════════════════════════════════════════════
    //  State updates after executeBuyback
    // ══════════════════════════════════════════════════════════════════════

    function test_StateUpdates_AfterFirstBuyback() public {
        _fundVault(DEFAULT_MAX);
        uint256 tsBefore = block.timestamp;

        vm.prank(owner); // no incentive → swapAmount == buybackAmount
        buyback.executeBuyback();

        assertEq(buyback.lastBuybackTime(), tsBefore,
            "lastBuybackTime should be set to block.timestamp at execution");
        assertEq(buyback.totalUsdcUsed(), DEFAULT_MAX,
            "totalUsdcUsed should equal buybackAmount");
        assertEq(buyback.triggerCount(), 1,
            "triggerCount should be incremented to 1");

        uint256 expectedGarc = (DEFAULT_MAX * GARC_RATE) / 1e6;
        assertEq(buyback.totalGarcBurned(), expectedGarc,
            "totalGarcBurned should equal garcReceived");
    }

    function test_StateUpdates_AccumulatesAcrossMultipleBuybacks() public {
        _fundVault(DEFAULT_MAX);
        vm.prank(owner);
        buyback.executeBuyback();

        _skipCooldowns(1);
        _fundVault(DEFAULT_MAX);
        vm.prank(owner);
        buyback.executeBuyback();

        assertEq(buyback.triggerCount(), 2);
        assertEq(buyback.totalUsdcUsed(), DEFAULT_MAX * 2);
    }

    function test_StateUpdates_WithCallerIncentive() public {
        // Execute once to anchor lastBuybackTime.
        _fundVault(DEFAULT_MAX);
        vm.prank(owner);
        buyback.executeBuyback();

        // Advance 1 period → incentiveBps = 20.
        vm.warp(block.timestamp + DEFAULT_COOLDOWN);
        _fundVault(DEFAULT_MAX);

        uint256 incentive   = (DEFAULT_MAX * 20) / BPS_DENOM;
        uint256 swapAmount  = DEFAULT_MAX - incentive;
        uint256 expectedGarc = (swapAmount * GARC_RATE) / 1e6;

        vm.prank(alice);
        buyback.executeBuyback();

        // totalUsdcUsed accumulates buybackAmount (not swapAmount)
        assertEq(buyback.totalUsdcUsed(), DEFAULT_MAX + DEFAULT_MAX,
            "totalUsdcUsed should count full buybackAmount including incentive portion");
        assertEq(buyback.totalGarcBurned(),
            (DEFAULT_MAX * GARC_RATE) / 1e6 + expectedGarc);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  BuybackExecuted event
    // ══════════════════════════════════════════════════════════════════════

    function test_EmitsBuybackExecuted_OwnerCaller() public {
        _fundVault(DEFAULT_MAX);

        uint256 buybackAmount = DEFAULT_MAX;
        uint256 callerIncentive = 0;
        uint256 swapAmount    = buybackAmount - callerIncentive;
        uint256 garcBurned    = (swapAmount * GARC_RATE) / 1e6;
        uint256 ts            = block.timestamp;

        vm.prank(owner);
        vm.expectEmit(true, false, false, true, address(buyback));
        emit GMBuyback.BuybackExecuted(owner, buybackAmount, callerIncentive, swapAmount, garcBurned, ts);
        buyback.executeBuyback();
    }

    function test_EmitsBuybackExecuted_NonOwnerCaller() public {
        // Set lastBuybackTime to current ts - 1 period so incentiveBps = 20.
        _fundVault(DEFAULT_MAX);
        vm.prank(owner);
        buyback.executeBuyback();
        vm.warp(block.timestamp + DEFAULT_COOLDOWN);

        _fundVault(DEFAULT_MAX);
        uint256 buybackAmount   = DEFAULT_MAX;
        uint256 callerIncentive = (buybackAmount * 20) / BPS_DENOM;
        uint256 swapAmount      = buybackAmount - callerIncentive;
        uint256 garcBurned      = (swapAmount * GARC_RATE) / 1e6;
        uint256 ts              = block.timestamp;

        vm.prank(alice);
        vm.expectEmit(true, false, false, true, address(buyback));
        emit GMBuyback.BuybackExecuted(alice, buybackAmount, callerIncentive, swapAmount, garcBurned, ts);
        buyback.executeBuyback();
    }

    // ══════════════════════════════════════════════════════════════════════
    //  Buyback capped at maxSingleBuyback even if vault has more
    // ══════════════════════════════════════════════════════════════════════

    function test_BuybackAmountCappedAtMaxSingleBuyback() public {
        // Fund vault with 2x maxSingleBuyback.
        _fundVault(DEFAULT_MAX * 2);

        vm.prank(owner);
        buyback.executeBuyback();

        // Only DEFAULT_MAX should be used.
        assertEq(buyback.totalUsdcUsed(), DEFAULT_MAX);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  Fuzz: incentive never exceeds maxIncentiveBps of buybackAmount
    // ══════════════════════════════════════════════════════════════════════

    function testFuzz_CallerIncentiveNeverExceedsMax(uint256 extraPeriods) public {
        extraPeriods = bound(extraPeriods, 1, 500);

        // Anchor lastBuybackTime.
        _fundVault(DEFAULT_MAX);
        vm.prank(owner);
        buyback.executeBuyback();

        vm.warp(block.timestamp + DEFAULT_COOLDOWN * extraPeriods);
        _fundVault(DEFAULT_MAX);

        uint256 aliceBalBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        buyback.executeBuyback();
        uint256 incentivePaid = usdc.balanceOf(alice) - aliceBalBefore;

        uint256 maxAllowed = (DEFAULT_MAX * MAX_BPS) / BPS_DENOM;
        assertLe(incentivePaid, maxAllowed,
            "incentive paid must not exceed maxIncentiveBps of buybackAmount");
    }
}
