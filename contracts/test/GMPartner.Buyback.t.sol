// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMPartnerTestBase} from "./GMPartner.Base.t.sol";
import {GMPartner} from "../GMPartner.sol";
import {GMBuyback} from "../GMBuyback.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";
import {MockUniswapV2Router} from "../test-helpers/MockUniswapV2Router.sol";

/// @dev Partner buyback share transfer (checkin / injectFunds), closed-day snapshot gate,
///      global outstandingReservedUsdc.
contract GMPartnerBuybackTest is GMPartnerTestBase {
    address internal constant GARC_ADDR = 0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc;
    address internal constant ROUTER_ADDR = 0xE27d5D256B370604F1Ff060fB489c6A8E3F8A6D9;

    // ── helpers ───────────────────────────────────────────────────────────

    /// partner USDC must always equal the tracked reward pool (everything else is forwarded).
    function _assertSolvent() internal view {
        assertEq(usdc.balanceOf(address(partner)), partner.rewardPoolBalance(), "partner USDC == rewardPoolBalance");
    }

    function _user(uint256 i) internal pure returns (address) {
        return address(uint160(0x10000 + i));
    }

    // ── injectFunds: buyback share lands in GMBuyback ─────────────────────

    function test_InjectFunds_BuybackShareTransferredToGMBuyback() public {
        _fund(alice, MIN_INJECT);
        vm.prank(alice);
        partner.injectFunds(MIN_INJECT);

        assertEq(usdc.balanceOf(address(mockBuyback)), MIN_INJECT / 10, "buyback got 10%");
        assertEq(usdc.balanceOf(address(mockMainPool)), MIN_INJECT / 10, "main pool got 10%");
        assertEq(partner.rewardPoolBalance(), (MIN_INJECT * 8) / 10);
        _assertSolvent();
    }

    function test_InjectFunds_ExactAccounting_OddAmountDustGoesToReward() public {
        uint256 amount = MIN_INJECT + 7; // 10_000_007
        _fund(alice, amount);
        vm.prank(alice);
        partner.injectFunds(amount);

        (uint256 rewardShare, uint256 mainShare, uint256 buybackShare) = _split(amount);
        assertEq(rewardShare + mainShare + buybackShare, amount, "split sums to amount");
        assertEq(partner.rewardPoolBalance(), rewardShare);
        assertEq(usdc.balanceOf(address(mockMainPool)), mainShare);
        assertEq(usdc.balanceOf(address(mockBuyback)), buybackShare);
        assertEq(usdc.balanceOf(address(partner)), rewardShare);
        assertEq(usdc.balanceOf(alice), 0);
    }

    function test_InjectFunds_EmitsFundsInjectedWithBuybackShare() public {
        _fund(alice, MIN_INJECT);
        (uint256 r, uint256 m, uint256 b) = _split(MIN_INJECT);
        vm.expectEmit(true, false, false, true, address(partner));
        emit GMPartner.FundsInjected(alice, MIN_INJECT, r, m, b);
        vm.prank(alice);
        partner.injectFunds(MIN_INJECT);
    }

    function test_InjectFunds_SecondInjectionAfterActivationAccumulatesBuyback() public {
        _activate();
        _fund(bob, 3e6);
        vm.prank(bob);
        partner.injectFunds(3e6);
        assertEq(usdc.balanceOf(address(mockBuyback)), 1e6 + 300_000);
        _assertSolvent();
    }

    function testFuzz_InjectFunds_AccountingExact(uint256 amount) public {
        amount = bound(amount, MIN_INJECT, 1e15);
        _fund(alice, amount);
        vm.prank(alice);
        partner.injectFunds(amount);

        uint256 toReward = partner.rewardPoolBalance();
        uint256 toMain = usdc.balanceOf(address(mockMainPool));
        uint256 toBuyback = usdc.balanceOf(address(mockBuyback));
        assertEq(toReward + toMain + toBuyback, amount, "reward + mainGM + buyback == amount");
        assertEq(toBuyback, (amount * BUYBACK_BPS) / BPS_DENOM);
        assertEq(usdc.balanceOf(address(partner)), toReward);
    }

    // ── checkin: buyback share lands in GMBuyback ─────────────────────────

    function test_Checkin_BuybackShareTransferredToGMBuyback() public {
        _activate();
        uint256 buybackBefore = usdc.balanceOf(address(mockBuyback));
        uint256 mainBefore = usdc.balanceOf(address(mockMainPool));
        uint256 rewardBefore = partner.rewardPoolBalance();

        _checkin(bob);

        (uint256 r, uint256 m, uint256 b) = _split(CHECKIN_FEE);
        assertEq(r + m + b, CHECKIN_FEE, "reward + mainGM + buyback == fee");
        assertEq(b, 10_000);
        assertEq(usdc.balanceOf(address(mockBuyback)) - buybackBefore, b);
        assertEq(usdc.balanceOf(address(mockMainPool)) - mainBefore, m);
        assertEq(partner.rewardPoolBalance() - rewardBefore, r);
        assertEq(usdc.balanceOf(bob), 0, "user paid exactly the fee");
        _assertSolvent();
    }

    function test_Checkin_EmitsFundsInjectedWithSplit() public {
        _activate();
        _fund(bob, CHECKIN_FEE);
        (uint256 r, uint256 m, uint256 b) = _split(CHECKIN_FEE);
        vm.expectEmit(true, false, false, true, address(partner));
        emit GMPartner.FundsInjected(bob, CHECKIN_FEE, r, m, b);
        vm.prank(bob);
        partner.checkin();
    }

    function test_Checkin_BuybackAccumulatesOverManyCheckins() public {
        _activate();
        uint256 before = usdc.balanceOf(address(mockBuyback));
        _buildStreak(bob, 10);
        assertEq(usdc.balanceOf(address(mockBuyback)) - before, 10 * 10_000);
        _assertSolvent();
    }

    function test_Checkin_PartnerKeepsNoBuybackShare() public {
        _activate();
        _checkin(bob);
        uint256 expectedReward = (MIN_INJECT * 8) / 10 + 80_000;
        assertEq(usdc.balanceOf(address(partner)), expectedReward);
    }

    // ── executeSnapshot: closed-day gate ──────────────────────────────────

    function _queueTier0() internal returns (uint256 day) {
        _activate();
        _buildStreak(alice, MILESTONE_0);
        day = block.timestamp / DAY;
        vm.prank(alice);
        partner.queueMilestoneClaim(0);
    }

    function test_ExecuteSnapshot_RevertsDayNotClosed_OnOpenDay() public {
        uint256 day = _queueTier0();
        vm.expectRevert(abi.encodeWithSelector(GMPartner.DayNotClosed.selector, day));
        partner.executeSnapshot(day);
        assertFalse(partner.snapshotExecuted(day));
    }

    function test_ExecuteSnapshot_RevertsDayNotClosed_AtLastSecond() public {
        uint256 day = _queueTier0();
        vm.warp((day + 1) * DAY - 1);
        vm.expectRevert(abi.encodeWithSelector(GMPartner.DayNotClosed.selector, day));
        partner.executeSnapshot(day);
    }

    function test_ExecuteSnapshot_SucceedsFirstSecondOfNextDay() public {
        uint256 day = _queueTier0();
        vm.warp((day + 1) * DAY);
        partner.executeSnapshot(day);
        assertTrue(partner.snapshotExecuted(day));
    }

    function test_ExecuteSnapshot_SucceedsEvenIfBuybackWouldRevert() public {
        uint256 day = _queueTier0();
        mockBuyback.setShouldRevert(true);
        vm.warp((day + 1) * DAY);
        partner.executeSnapshot(day);
        assertTrue(partner.snapshotExecuted(day));
    }

    function test_ExecuteSnapshot_DoesNotCallBuyback() public {
        uint256 day = _queueTier0();
        uint256 buybackBal = usdc.balanceOf(address(mockBuyback));
        vm.warp((day + 1) * DAY);
        partner.executeSnapshot(day);
        assertEq(mockBuyback.executeCallCount(), 0, "snapshot no longer triggers buyback");
        assertEq(mockBuyback.buybackAndBurnCallCount(), 0);
        assertEq(usdc.balanceOf(address(mockBuyback)), buybackBal, "buyback USDC untouched");
    }

    function test_ExecuteSnapshot_EmitsSnapshotExecuted() public {
        uint256 day = _queueTier0();
        uint256 total = partner.snapshotTotalClaimUsdc(day);
        vm.warp((day + 1) * DAY);
        vm.expectEmit(true, false, false, true, address(partner));
        emit GMPartner.SnapshotExecuted(day, total, block.timestamp);
        partner.executeSnapshot(day);
    }

    // ── outstandingReservedUsdc ───────────────────────────────────────────

    function test_Queue_IncrementsOutstandingByUsdcToPull() public {
        _queueTier0();
        uint256 claim = partner.pendingClaimUsdc(alice, 0);
        assertEq(claim, (partner.rewardPoolBalance() * RELEASE_BPS_0) / BPS_DENOM);
        assertEq(partner.outstandingReservedUsdc(), (claim * 9 + 7) / 8);
    }

    function test_Snapshot_DoesNotReleaseOutstanding_ClaimDoes() public {
        uint256 day = _queueTier0();
        uint256 reserved = partner.outstandingReservedUsdc();
        assertGt(reserved, 0);

        vm.warp((day + 1) * DAY);
        partner.executeSnapshot(day);
        assertEq(partner.outstandingReservedUsdc(), reserved, "snapshot leaves reservation");

        uint256 claim = partner.pendingClaimUsdc(alice, 0);
        vm.prank(alice);
        partner.claimMilestone(0);
        assertEq(partner.outstandingReservedUsdc(), 0, "claim releases reservation");
        assertEq(usdc.balanceOf(alice), claim, "alice received claimUsdc");
        _assertSolvent();
    }

    function _pullFor(uint256 bps) internal view returns (uint256 pull, uint256 available) {
        uint256 pool = partner.rewardPoolBalance();
        uint256 claim = (pool * bps) / BPS_DENOM;
        pull = (claim * 9 + 7) / 8;
        uint256 outstanding = partner.outstandingReservedUsdc();
        available = pool > outstanding ? pool - outstanding : 0;
    }

    function test_Queue_GlobalReservationPreventsOverReservingAcrossDays() public {
        _activate();
        uint256 n = 10;
        // 15 days of check-ins by 10 users; 5 users queue tier1 (14d) on day 13, the rest on day 14.
        for (uint256 d = 0; d <= 14; d++) {
            if (d > 0) vm.warp(block.timestamp + DAY);
            for (uint256 i = 0; i < n; i++) _checkin(_user(i));
            if (d == 13) {
                for (uint256 i = 0; i < 5; i++) {
                    vm.prank(_user(i));
                    partner.queueMilestoneClaim(1);
                }
            }
        }
        uint256 day1 = block.timestamp / DAY;
        uint256 day0 = day1 - 1;
        uint256 reservedDay0 = partner.snapshotReservedUsdc(day0);
        assertEq(partner.outstandingReservedUsdc(), reservedDay0);

        // Keep queueing on day 1 until the GLOBAL availability is exhausted.
        uint256 failedUser = type(uint256).max;
        for (uint256 i = 5; i < n; i++) {
            (uint256 pull, uint256 available) = _pullFor(RELEASE_BPS_1);
            if (pull > available) {
                // The per-day counter alone would NOT have blocked this queue.
                uint256 pool = partner.rewardPoolBalance();
                assertLe(partner.snapshotReservedUsdc(day1) + pull, pool, "per-day accounting would have allowed it");
                vm.prank(_user(i));
                vm.expectRevert(abi.encodeWithSelector(GMPartner.InsufficientRewardPool.selector, pull, available));
                partner.queueMilestoneClaim(1);
                failedUser = i;
                break;
            }
            vm.prank(_user(i));
            partner.queueMilestoneClaim(1);
        }
        assertLt(failedUser, n, "global reservation must eventually block a queue");
        uint256 outstandingBefore = partner.outstandingReservedUsdc();

        // Releasing day0 reservations through claims frees capacity: the blocked user can queue.
        partner.executeSnapshot(day0);
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(_user(i));
            partner.claimMilestone(1);
        }
        assertEq(partner.outstandingReservedUsdc(), outstandingBefore - reservedDay0);
        (uint256 pull2, uint256 avail2) = _pullFor(RELEASE_BPS_1);
        assertLe(pull2, avail2, "capacity freed by claims");
        vm.prank(_user(failedUser));
        partner.queueMilestoneClaim(1);
        assertGt(partner.pendingClaimDay(_user(failedUser), 1), 0);
        _assertSolvent();
    }

    // ── integration with the REAL GMBuyback ───────────────────────────────

    function _deployReal() internal returns (GMPartner p2, GMBuyback realBuyback) {
        MockERC20 garcImpl = new MockERC20("Mock gARC", "mGARC", 18);
        vm.etch(GARC_ADDR, address(garcImpl).code);
        MockUniswapV2Router routerImpl = new MockUniswapV2Router();
        vm.etch(ROUTER_ADDR, address(routerImpl).code);
        realBuyback = new GMBuyback(owner);

        uint256[4] memory mDays;
        mDays[0] = MILESTONE_0;
        mDays[1] = MILESTONE_1;
        p2 = new GMPartner(
            owner, operator, address(mockCheckin), address(realBuyback), address(mockMainPool),
            "real-buyback", "https://x", MILESTONE_COUNT, mDays, true
        );
    }

    function _fundFor(GMPartner p, address user, uint256 amount) internal {
        usdc.mint(user, amount);
        vm.prank(user);
        usdc.approve(address(p), amount);
    }

    function test_RealBuyback_PartnerSnapshotLeavesBuybackUntouched_KeeperSpendsShare() public {
        (GMPartner p2, GMBuyback realBuyback) = _deployReal();

        // activate + 7-day streak for alice (each check-in forwards 10% of the fee to the buyback)
        _fundFor(p2, alice, MIN_INJECT);
        vm.prank(alice);
        p2.injectFunds(MIN_INJECT);
        for (uint256 i = 0; i < MILESTONE_0; i++) {
            if (i > 0) vm.warp(block.timestamp + DAY);
            _fundFor(p2, alice, CHECKIN_FEE);
            vm.prank(alice);
            p2.checkin();
        }
        vm.prank(alice);
        p2.queueMilestoneClaim(0);
        uint256 day = block.timestamp / DAY;

        uint256 forwarded = 1e6 + MILESTONE_0 * 10_000;
        assertEq(usdc.balanceOf(address(realBuyback)), forwarded, "buyback holds forwarded share");

        // Partner snapshot does not touch GMBuyback.
        vm.warp((day + 1) * DAY);
        p2.executeSnapshot(day);
        assertTrue(p2.snapshotExecuted(day));
        assertEq(usdc.balanceOf(address(realBuyback)), forwarded, "balance untouched by snapshot");
        assertEq(realBuyback.totalUsdcUsed(), 0);
        assertEq(realBuyback.triggerCount(), 0);
        assertEq(realBuyback.lastBuybackTime(), 0);

        // A keeper calls GMBuyback directly: spends the forwarded share and earns the incentive.
        address keeper = makeAddr("keeper");
        assertTrue(realBuyback.canExecute());
        uint256 incentive = (forwarded * realBuyback.getCurrentIncentiveBps()) / BPS_DENOM;
        assertGt(incentive, 0);
        vm.prank(keeper);
        realBuyback.executeBuyback();

        assertEq(usdc.balanceOf(keeper), incentive, "keeper received incentive");
        assertEq(usdc.balanceOf(address(realBuyback)), 0, "forwarded share fully spent");
        assertEq(realBuyback.totalUsdcUsed(), forwarded);
        assertEq(realBuyback.triggerCount(), 1);
        assertEq(MockERC20(GARC_ADDR).balanceOf(address(realBuyback)), 0, "burned");
    }

    function test_RealBuyback_PartnerShareIsSpentByExecuteBuyback() public {
        (GMPartner p2, GMBuyback realBuyback) = _deployReal();
        usdc.mint(alice, MIN_INJECT);
        vm.startPrank(alice);
        usdc.approve(address(p2), MIN_INJECT);
        p2.injectFunds(MIN_INJECT);
        vm.stopPrank();

        assertEq(usdc.balanceOf(address(realBuyback)), 1e6, "10% of 10 USDC");
        assertTrue(realBuyback.canExecute());

        vm.prank(owner);
        realBuyback.executeBuyback();
        assertEq(usdc.balanceOf(address(realBuyback)), 0);
        assertEq(realBuyback.totalUsdcUsed(), 1e6);
        assertEq(MockERC20(GARC_ADDR).balanceOf(address(realBuyback)), 0, "burned");
    }
}
