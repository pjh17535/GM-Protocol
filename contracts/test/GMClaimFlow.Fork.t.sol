// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {GMCheckIn} from "../GMCheckIn.sol";
import {GMBuyback} from "../GMBuyback.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";

interface IGMPoolFork {
    function owner() external view returns (address);
    function checkinContract() external view returns (address);
    function poolBalance(uint8 poolId) external view returns (uint256);
    function gArcClaimBalance() external view returns (uint256);
    function setCheckinContract(address newCheckinContract) external;
}

interface IPairFork {
    function token0() external view returns (address);
    function getReserves() external view returns (uint112, uint112, uint32);
}

interface IGMSoulBoundFork {
    function owner() external view returns (address);
    function setMinter(address newMinter) external;
    function balanceOf(address account) external view returns (uint256);
}

/// @dev Fork test on Arc Testnet (pinned block). One scenario: 30 daily check-ins ->
///      queue Bronze -> next day executeSnapshot (REAL swap + burn) -> claimMilestone.
///      Network-dependent: an RPC failure is an infra flake, not a contract bug.
///
///      USDC NOTE: on Arc, 0x3600.. is a proxy whose implementation moves balances through the
///      native-coin precompile at 0x1800.. (a 1-byte stub in a local EVM), so forge cannot execute
///      real USDC transfers (StackUnderflow). We therefore swap ONLY the USDC token code for a
///      vanilla 6-decimals ERC-20 and mirror the balances the scenario depends on from the
///      forked state (pair USDC reserve, GMPool total pool balances, pool owner). Everything else
///      is real fork state/bytecode: GMPool v2, the live UniswapV2 pair + router, real gARC,
///      GMSoulBound.
contract GMClaimFlowForkTest is Test {
    string internal constant RPC = "https://rpc.testnet.arc.io";
    uint256 internal constant FORK_BLOCK = 71_524_396; // head(71_524_401) - 5

    address internal constant USDC = 0x3600000000000000000000000000000000000000;
    address internal constant GARC = 0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc;
    address internal constant PAIR = 0xc0E9695Ab4E41F4477074845046b3D152C4c8958;
    address internal constant POOL = 0xC3832c0169C1602D581cC6816414Ad05A855e713;
    address internal constant SOULBOUND = 0xB845E2f69d7D5426896B4083594B3C26D4bB8ff2;
    address internal constant POOL_OWNER = 0xe5096Af190d36CBc4363699D561EE651C07c276a;

    uint8 internal constant BRONZE = 0;
    uint8 internal constant POOL_REWARD = 0;
    uint256 internal constant DAY = 86_400;
    uint256 internal constant FEE = 100_000;

    GMBuyback internal buyback;
    GMCheckIn internal gm;
    address internal user;

    function setUp() public {
        vm.createSelectFork(RPC, FORK_BLOCK);

        assertEq(IGMPoolFork(POOL).owner(), POOL_OWNER, "pool owner as documented");
        _mirrorUsdc();

        // Deploy the new contracts.
        buyback = new GMBuyback(POOL_OWNER);
        gm = new GMCheckIn(POOL_OWNER, POOL, address(buyback), PAIR);

        // Wire the real pool / soulbound / buyback to the new GMCheckIn.
        vm.startPrank(POOL_OWNER);
        IGMPoolFork(POOL).setCheckinContract(address(gm));
        buyback.setAuthorizedCaller(address(gm), true);
        gm.setSoulBoundContract(SOULBOUND);
        vm.stopPrank();
        vm.prank(IGMSoulBoundFork(SOULBOUND).owner());
        IGMSoulBoundFork(SOULBOUND).setMinter(address(gm));

        // Fresh user funded by impersonating the pool owner and transferring USDC (no `deal`).
        user = makeAddr("forkUser");
        vm.prank(POOL_OWNER);
        require(IERC20(USDC).transfer(user, 10e6), "fund user");
        assertEq(IERC20(USDC).balanceOf(user), 10e6);
    }

    /// Replace the USDC token code and re-create the balances that matter, derived from fork state.
    function _mirrorUsdc() internal {
        // Read fork state BEFORE etching (storage reads of pools/pair are plain SLOADs).
        (uint112 r0, uint112 r1,) = IPairFork(PAIR).getReserves();
        uint256 pairUsdc = IPairFork(PAIR).token0() == USDC ? r0 : r1;
        uint256 poolUsdc;
        for (uint8 id = 0; id < 4; id++) {
            poolUsdc += IGMPoolFork(POOL).poolBalance(id);
        }

        MockERC20 impl = new MockERC20("USDC", "USDC", 6);
        vm.etch(USDC, address(impl).code);
        MockERC20 usdc = MockERC20(USDC);
        usdc.mint(PAIR, pairUsdc); // pair balance == reserve at the pinned block
        usdc.mint(POOL, poolUsdc); // pool holds the sum of its sub-pool balances
        usdc.mint(POOL_OWNER, 134_755_953); // owner USDC balance at the pinned block (cast call, block 71524396)
    }

    function test_Fork_FullClaimFlow_RealSwapAndBurn() public {
        // ── 30 daily check-ins ───────────────────────────────────────────
        uint256 start = vm.getBlockTimestamp(); // (not block.timestamp: via-ir re-materialises it after vm.warp)
        for (uint256 i = 0; i < 30; i++) {
            vm.warp(start + i * DAY);
            vm.startPrank(user);
            IERC20(USDC).approve(address(gm), FEE);
            gm.checkin();
            vm.stopPrank();
        }
        (, uint256 streak,) = gm.getUserInfo(user);
        assertEq(streak, 30, "30-day streak");
        assertEq(IERC20(USDC).balanceOf(user), 10e6 - 30 * FEE, "paid 30 fees");
        assertEq(IERC20(USDC).balanceOf(address(gm)), 0, "fees forwarded to pool");

        // ── queue Bronze ────────────────────────────────────────────────
        uint256 rewardBalAtQueue = IGMPoolFork(POOL).poolBalance(POOL_REWARD);
        vm.prank(user);
        gm.queueMilestoneClaim(BRONZE);

        uint256 queueDay = gm.pendingClaimDay(user, BRONZE);
        uint256 claimUsdc = gm.pendingClaimUsdc(user, BRONZE);
        assertEq(queueDay, block.timestamp / DAY);
        assertEq(claimUsdc, (rewardBalAtQueue * 150) / 10_000, "Bronze = 1.5% of reward pool");
        // 9/8 gross-up, rounded UP exactly as the contract does.
        uint256 expectedPull = (claimUsdc * 9 + 7) / 8;
        assertEq(gm.snapshotTotalClaimUsdc(queueDay), expectedPull);
        assertEq(gm.outstandingReservedUsdc(), expectedPull);

        // ── same day: snapshot must refuse ──────────────────────────────
        vm.expectRevert(abi.encodeWithSelector(GMCheckIn.DayNotClosed.selector, queueDay));
        gm.executeSnapshot(queueDay);

        // ── next day: snapshot performs a REAL swap + burn on the live pair ──
        vm.warp((queueDay + 1) * DAY);

        uint256 poolRewardBefore = IGMPoolFork(POOL).poolBalance(POOL_REWARD);
        uint256 supplyBefore = IERC20(GARC).totalSupply();

        vm.expectEmit(true, false, false, false, address(gm));
        emit GMCheckIn.SnapshotBuyback(queueDay, expectedPull, 0);
        gm.executeSnapshot(queueDay);

        uint256 poolRewardAfter = IGMPoolFork(POOL).poolBalance(POOL_REWARD);
        uint256 supplyAfter = IERC20(GARC).totalSupply();
        uint256 burned = buyback.totalGarcBurned();

        assertTrue(gm.snapshotExecuted(queueDay));
        assertEq(gm.outstandingReservedUsdc(), 0, "reservation released");
        assertEq(poolRewardBefore - poolRewardAfter, expectedPull, "pool reward decreased by ceil(9/8 * claim)");
        assertGt(burned, 0, "something was burned");
        assertEq(supplyBefore - supplyAfter, burned, "gARC supply fell by exactly the burned amount");
        assertEq(buyback.totalUsdcUsed(), expectedPull, "buyback spent exactly totalUsdc");
        assertEq(IERC20(USDC).balanceOf(address(gm)), 0, "no USDC left in GMCheckIn");
        assertEq(IERC20(USDC).balanceOf(address(buyback)), 0, "no USDC left in GMBuyback");
        assertEq(IERC20(GARC).balanceOf(address(buyback)), 0, "no gARC left in GMBuyback");
        assertEq(IERC20(USDC).allowance(address(gm), address(buyback)), 0, "approval reset");

        // ── claim ───────────────────────────────────────────────────────
        uint256 expectedGArc = gm.gArcForUsdc(claimUsdc);
        assertGt(expectedGArc, 0);
        uint256 poolGArcBefore = IGMPoolFork(POOL).gArcClaimBalance();
        uint256 userGArcBefore = IERC20(GARC).balanceOf(user);

        vm.prank(user);
        gm.claimMilestone(BRONZE);

        assertEq(IERC20(GARC).balanceOf(user) - userGArcBefore, expectedGArc, "user got gArcForUsdc(claimUsdc)");
        assertEq(poolGArcBefore - IGMPoolFork(POOL).gArcClaimBalance(), expectedGArc, "pool gARC debited equally");
        assertEq(gm.totalGArcDistributed(), expectedGArc);
        assertEq(gm.totalUsdcClaimed(), claimUsdc);
        assertEq(gm.pendingClaimDay(user, BRONZE), 0);
        assertEq(IERC20(GARC).balanceOf(address(gm)), 0);
        assertEq(IERC20(USDC).balanceOf(address(gm)), 0, "still no USDC in GMCheckIn");
        assertEq(IERC20(USDC).balanceOf(address(buyback)), 0, "still no USDC in GMBuyback");
        // Soulbound mint is best-effort (try/catch); informational only.
        emit log_named_uint("soulbound balance after claim", IGMSoulBoundFork(SOULBOUND).balanceOf(user));
        emit log_named_uint("claimUsdc", claimUsdc);
        emit log_named_uint("usdc pulled (totalUsdc)", expectedPull);
        emit log_named_uint("gARC burned", burned);
        emit log_named_uint("gARC paid to user", expectedGArc);
    }
}
