// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GMCheckInTestBase} from "./GMCheckIn.Base.t.sol";
import {GMCheckIn} from "../GMCheckIn.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";

/// @dev Drives GMCheckIn through bounded random actions. All external calls are try/catch'd.
contract GMCheckInHandler is Test {
    GMCheckIn public gm;
    MockERC20 public usdc;
    address[3] public users;

    uint256[] public queuedDays; // days on which at least one claim was queued
    mapping(uint256 => bool) public seen;
    uint256 public ghostGArcPaid;
    uint256 public claimsDone;
    uint256 public snapshotsDone;
    uint256 public ghostClaimUsdc;

    constructor(GMCheckIn _gm, MockERC20 _usdc) {
        gm = _gm;
        usdc = _usdc;
        users[0] = makeAddr("u0");
        users[1] = makeAddr("u1");
        users[2] = makeAddr("u2");
    }

    function queuedDaysLength() external view returns (uint256) {
        return queuedDays.length;
    }

    /// Advance `reps` consecutive days with everyone checking in (builds streaks).
    function dailyAll(uint256 reps) external {
        reps = bound(reps, 30, 40);
        uint256 t = vm.getBlockTimestamp(); // via-ir may CSE block.timestamp across the loop
        for (uint256 r = 0; r < reps; r++) {
            t += 1 days;
            vm.warp(t);
            for (uint256 i = 0; i < 3; i++) {
                usdc.mint(users[i], 100_000);
                vm.startPrank(users[i]);
                usdc.approve(address(gm), 100_000);
                try gm.checkin() {} catch {}
                vm.stopPrank();
            }
        }
    }

    function skipDays(uint256 n) external {
        n = bound(n, 1, 3);
        vm.warp(vm.getBlockTimestamp() + n * 1 days);
    }

    function queue(uint256 idx, uint256 tier) external {
        idx = bound(idx, 0, 2);
        tier = bound(tier, 0, 3);
        vm.prank(users[idx]);
        try gm.queueMilestoneClaim(uint8(tier)) {
            uint256 d = gm.pendingClaimDay(users[idx], uint8(tier));
            if (!seen[d]) {
                seen[d] = true;
                queuedDays.push(d);
            }
        } catch {}
    }

    function snapshot(uint256 pick) external {
        if (queuedDays.length == 0) return;
        uint256 d = queuedDays[bound(pick, 0, queuedDays.length - 1)];
        try gm.executeSnapshot(d) { snapshotsDone++; } catch {}
    }

    function claim(uint256 idx, uint256 tier) external {
        idx = bound(idx, 0, 2);
        tier = bound(tier, 0, 3);
        uint256 usdcAmt = gm.pendingClaimUsdc(users[idx], uint8(tier));
        uint256 expected;
        if (usdcAmt > 0) expected = gm.gArcForUsdc(usdcAmt);
        vm.prank(users[idx]);
        try gm.claimMilestone(uint8(tier)) {
            claimsDone++;
            ghostGArcPaid += expected;
            ghostClaimUsdc += usdcAmt;
        } catch {}
    }
}

/// forge-config: default.invariant.runs = 24
/// forge-config: default.invariant.depth = 40
contract GMCheckInInvariantTest is GMCheckInTestBase {
    GMCheckInHandler internal handler;

    function setUp() public override {
        super.setUp();
        gmPool.setPoolBalance(POOL_REWARD, 1_000_000e6);
        handler = new GMCheckInHandler(gm, usdc);
        targetContract(address(handler));
    }

    /// Guard against a vacuous campaign: the handler's happy path must reach queue/snapshot/claim.
    function test_HandlerHappyPathReachesClaim() public {
        handler.dailyAll(30);
        (, uint256 st, uint256 tc) = gm.getUserInfo(handler.users(0));
        assertEq(st, 30, "streak");
        assertEq(tc, 30, "total");
        handler.queue(0, 0);
        assertEq(handler.queuedDaysLength(), 1, "queued");
        handler.skipDays(1);
        handler.snapshot(0);
        assertEq(handler.snapshotsDone(), 1, "snapshot");
        handler.claim(0, 0);
        assertEq(handler.claimsDone(), 1, "claim");
        assertEq(gm.totalGArcDistributed(), handler.ghostGArcPaid());
        assertGt(gm.totalGArcDistributed(), 0);
    }

    /// GMCheckIn never retains USDC: fees go to the pool, snapshot USDC goes to the buyback.
    function invariant_GMCheckInHoldsNoUsdc() public view {
        assertEq(usdc.balanceOf(address(gm)), 0);
    }

    /// Global reservation == sum of totals of queued-but-unexecuted days.
    function invariant_OutstandingEqualsUnexecutedSnapshotTotals() public view {
        uint256 sum;
        uint256 n = handler.queuedDaysLength();
        for (uint256 i = 0; i < n; i++) {
            uint256 d = handler.queuedDays(i);
            if (!gm.snapshotExecuted(d)) sum += gm.snapshotTotalClaimUsdc(d);
        }
        assertEq(gm.outstandingReservedUsdc(), sum);
    }

    /// totalGArcDistributed always equals the converted amounts actually paid.
    function invariant_DistributedMatchesPayouts() public view {
        assertEq(gm.totalGArcDistributed(), handler.ghostGArcPaid());
        assertEq(gm.totalUsdcClaimed(), handler.ghostClaimUsdc());
    }
}
