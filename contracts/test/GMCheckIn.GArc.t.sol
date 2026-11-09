// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMCheckInTestBase} from "./GMCheckIn.Base.t.sol";
import {GMCheckIn} from "../GMCheckIn.sol";
import {MockUniswapV2Pair} from "../test-helpers/MockUniswapV2Pair.sol";

/// @dev gArcForUsdc (LP spot conversion) and claimMilestone paying the converted amount.
contract GMCheckInGArcTest is GMCheckInTestBase {
    function _swappedPair(uint112 rUsdc, uint112 rGarc) internal returns (MockUniswapV2Pair) {
        // gARC is token0 (reserve0), USDC is token1 (reserve1).
        return new MockUniswapV2Pair(GARC_ADDR, USDC_ADDR, rGarc, rUsdc);
    }

    function _useGm(MockUniswapV2Pair p) internal {
        gm = new GMCheckIn(owner, address(gmPool), address(gmBuyback), address(p));
    }

    // ── gArcForUsdc math ──────────────────────────────────────────────────

    function test_GArcForUsdc_OneUsdcEquals2000GArc_UsdcToken0() public view {
        // 6-decimal USDC in, 18-decimal gARC out.
        assertEq(gm.gArcForUsdc(1e6), 2_000e18);
    }

    function test_GArcForUsdc_OneUsdcEquals2000GArc_UsdcToken1() public {
        _useGm(_swappedPair(RES_USDC, RES_GARC));
        assertEq(gm.gArcForUsdc(1e6), 2_000e18);
    }

    function test_GArcForUsdc_BothOrderingsAgree() public {
        uint256 a = gm.gArcForUsdc(123_456_789);
        _useGm(_swappedPair(RES_USDC, RES_GARC));
        assertEq(gm.gArcForUsdc(123_456_789), a);
        assertEq(a, uint256(123_456_789) * GARC_PER_USDC_UNIT);
    }

    function test_GArcForUsdc_SmallestUnitScalesByDecimalGap() public view {
        // 1 base unit of USDC (1e-6) -> 2e15 base units of gARC (0.002 gARC)
        assertEq(gm.gArcForUsdc(1), 2e15);
    }

    function test_GArcForUsdc_ZeroInputReturnsZero() public view {
        assertEq(gm.gArcForUsdc(0), 0);
    }

    function test_GArcForUsdc_NonIntegerPriceFloors() public {
        // reserves: 3_000_000 USDC vs 7_000_000_000 gARC -> 2333.33.. gARC per USDC
        MockUniswapV2Pair p = new MockUniswapV2Pair(USDC_ADDR, GARC_ADDR, 3_000_000e6, 7_000_000_000e18);
        _useGm(p);
        uint256 expected = (uint256(1e6) * 7_000_000_000e18) / 3_000_000e6;
        assertEq(gm.gArcForUsdc(1e6), expected);
        assertEq(expected, 2_333_333_333_333_333_333_333); // floor
    }

    function test_GArcForUsdc_FollowsLiveReserves() public {
        assertEq(gm.gArcForUsdc(1e6), 2_000e18);
        // Pool price doubles (reserves of USDC halved) -> twice the gARC per USDC.
        pair.setReserves(RES_USDC / 2, RES_GARC);
        assertEq(gm.gArcForUsdc(1e6), 4_000e18);
    }

    function test_GArcForUsdc_RevertsOnZeroUsdcReserve_Token0() public {
        pair.setReserves(0, RES_GARC);
        vm.expectRevert(GMCheckIn.InvalidLpReserves.selector);
        gm.gArcForUsdc(1e6);
    }

    function test_GArcForUsdc_RevertsOnZeroGArcReserve_Token0() public {
        pair.setReserves(RES_USDC, 0);
        vm.expectRevert(GMCheckIn.InvalidLpReserves.selector);
        gm.gArcForUsdc(1e6);
    }

    function test_GArcForUsdc_RevertsOnZeroReserves_Token1Ordering() public {
        MockUniswapV2Pair p = _swappedPair(RES_USDC, RES_GARC);
        _useGm(p);
        p.setReserves(RES_GARC, 0); // USDC reserve (reserve1) = 0
        vm.expectRevert(GMCheckIn.InvalidLpReserves.selector);
        gm.gArcForUsdc(1e6);
        p.setReserves(0, RES_USDC); // gARC reserve (reserve0) = 0
        vm.expectRevert(GMCheckIn.InvalidLpReserves.selector);
        gm.gArcForUsdc(1e6);
    }

    function test_GArcForUsdc_RevertsOnEmptyPool() public {
        pair.setReserves(0, 0);
        vm.expectRevert(GMCheckIn.InvalidLpReserves.selector);
        gm.gArcForUsdc(1);
    }

    function testFuzz_GArcForUsdc_MatchesRatioBothOrderings(uint256 amt, uint112 rUsdc, uint112 rGarc) public {
        amt = bound(amt, 0, 1e24);
        rUsdc = uint112(bound(rUsdc, 1e6, 1e20));
        rGarc = uint112(bound(rGarc, 1e18, 1e30));
        uint256 expected = (amt * uint256(rGarc)) / uint256(rUsdc);

        pair.setReserves(rUsdc, rGarc);
        assertEq(gm.gArcForUsdc(amt), expected);

        _useGm(_swappedPair(rUsdc, rGarc));
        assertEq(gm.gArcForUsdc(amt), expected);
    }

    function testFuzz_GArcForUsdc_Monotonic(uint256 a, uint256 b) public view {
        a = bound(a, 0, 1e24);
        b = bound(b, a, 1e24);
        assertLe(gm.gArcForUsdc(a), gm.gArcForUsdc(b));
    }

    // ── claimMilestone pays gArcForUsdc(claimUsdc) ────────────────────────

    function _queueBronze(uint256 poolBal) internal returns (uint256 day, uint256 claimUsdc) {
        gmPool.setPoolBalance(POOL_REWARD, poolBal);
        _buildStreak(alice, BRONZE_DAYS);
        _queueMilestone(alice, BRONZE);
        day = gm.pendingClaimDay(alice, BRONZE);
        claimUsdc = gm.pendingClaimUsdc(alice, BRONZE);
        _executeSnapshot(day);
    }

    function test_Claim_PaysConvertedGArc_AndTracksDistribution() public {
        (, uint256 claimUsdc) = _queueBronze(2_000_000e6);
        assertEq(claimUsdc, (2_000_000e6 * BRONZE_BPS) / 10_000);

        uint256 expected = gm.gArcForUsdc(claimUsdc);
        assertEq(expected, claimUsdc * GARC_PER_USDC_UNIT, "fixture conversion");
        assertGt(expected, claimUsdc, "converted amount differs from raw USDC amount");

        _claimMilestone(alice, BRONZE);
        assertEq(garc.balanceOf(alice), expected, "user got the converted amount");
        assertEq(gm.totalGArcDistributed(), expected, "totalGArcDistributed matches payout");
        assertEq(gm.totalUsdcClaimed(), claimUsdc);
    }

    function test_Claim_PaysConvertedGArc_UsdcToken1Ordering() public {
        _useGm(_swappedPair(RES_USDC, RES_GARC));
        (, uint256 claimUsdc) = _queueBronze(2_000_000e6);
        _claimMilestone(alice, BRONZE);
        assertEq(garc.balanceOf(alice), claimUsdc * GARC_PER_USDC_UNIT);
    }

    function test_Claim_UsesClaimTimeSpotPrice() public {
        (, uint256 claimUsdc) = _queueBronze(2_000_000e6);
        // Price moves between snapshot and claim.
        pair.setReserves(RES_USDC, RES_GARC * 3);
        _claimMilestone(alice, BRONZE);
        assertEq(garc.balanceOf(alice), claimUsdc * GARC_PER_USDC_UNIT * 3);
        assertEq(gm.totalGArcDistributed(), claimUsdc * GARC_PER_USDC_UNIT * 3);
    }

    function test_Claim_EmitsConvertedAmount() public {
        (uint256 day, uint256 claimUsdc) = _queueBronze(2_000_000e6);
        vm.expectEmit(true, false, false, true, address(gm));
        emit GMCheckIn.MilestoneClaimed(alice, BRONZE, claimUsdc, claimUsdc * GARC_PER_USDC_UNIT, day);
        _claimMilestone(alice, BRONZE);
    }

    function test_Claim_RevertsOnZeroLpReserves() public {
        _queueBronze(2_000_000e6);
        pair.setReserves(0, 0);
        vm.prank(alice);
        vm.expectRevert(GMCheckIn.InvalidLpReserves.selector);
        gm.claimMilestone(BRONZE);
        // Claim remains pending and can be completed after the pool recovers.
        assertGt(gm.pendingClaimDay(alice, BRONZE), 0);
        pair.setReserves(RES_USDC, RES_GARC);
        _claimMilestone(alice, BRONZE);
        assertGt(garc.balanceOf(alice), 0);
    }

    function test_Claim_RevertsZeroClaimAmountWhenConversionRoundsToZero() public {
        _queueBronze(2_000_000e6);
        // 1 gARC wei vs huge USDC reserve -> floor(claim * 1 / 1e30) == 0
        pair.setReserves(uint112(1e30), 1);
        vm.prank(alice);
        vm.expectRevert(GMCheckIn.ZeroClaimAmount.selector);
        gm.claimMilestone(BRONZE);
    }
}
