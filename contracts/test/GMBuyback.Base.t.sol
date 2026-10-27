// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GMBuyback} from "../GMBuyback.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";
import {MockUniswapV2Router} from "../test-helpers/MockUniswapV2Router.sol";

/// @dev Shared fixtures for all GMBuyback test categories.
///
///  Three hardcoded constants (from the contract source):
///    USDC   = 0x3600000000000000000000000000000000000000
///    GARC   = 0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc
///    ROUTER = 0xE27d5D256B370604F1Ff060fB489c6A8E3F8A6D9
///
///  All three are etched so the contract's hardcoded references resolve to
///  our mock implementations.
abstract contract GMBuybackTestBase is Test {
    // ── Hardcoded contract addresses ──────────────────────────────────────
    address internal constant USDC_ADDR   = 0x3600000000000000000000000000000000000000;
    address internal constant GARC_ADDR   = 0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc;
    address internal constant ROUTER_ADDR = 0xE27d5D256B370604F1Ff060fB489c6A8E3F8A6D9;

    // ── GMBuyback constants (mirrors source) ──────────────────────────────
    uint256 internal constant BPS_DENOM         = 10_000;
    uint256 internal constant SLIPPAGE_NUM      = 995;
    uint256 internal constant SLIPPAGE_DEN      = 1_000;
    uint256 internal constant DEFAULT_COOLDOWN  = 1_800;  // 30 min
    uint256 internal constant DEFAULT_MIN       = 1e6;    // 1 USDC
    uint256 internal constant DEFAULT_MAX       = 10e6;   // 10 USDC
    uint256 internal constant BASE_BPS          = 10;
    uint256 internal constant MAX_BPS           = 100;

    // ── Actors ────────────────────────────────────────────────────────────
    address internal owner        = makeAddr("owner");
    address internal alice        = makeAddr("alice");
    address internal bob          = makeAddr("bob");
    address internal reserveVault = makeAddr("reserveVault");

    // ── Mock handles ──────────────────────────────────────────────────────
    MockERC20             internal usdc;
    MockERC20             internal garc;
    MockUniswapV2Router   internal router;

    // ── Contract under test ───────────────────────────────────────────────
    GMBuyback internal buyback;

    // ── Baseline timestamp (well above 0 to avoid cooldown edge cases) ────
    uint256 internal constant START_TS = 1_000_000;

    function setUp() public virtual {
        vm.warp(START_TS);

        // 1. Deploy mocks to throwaway addresses.
        MockERC20           usdcImpl   = new MockERC20("Mock USDC", "mUSDC", 6);
        MockERC20           garcImpl   = new MockERC20("Mock gARC", "mGARC", 18);
        MockUniswapV2Router routerImpl = new MockUniswapV2Router();

        // 2. Etch their bytecode onto the canonical addresses the contract uses.
        vm.etch(USDC_ADDR,   address(usdcImpl).code);
        vm.etch(GARC_ADDR,   address(garcImpl).code);
        vm.etch(ROUTER_ADDR, address(routerImpl).code);

        // 3. Bind typed handles.
        usdc   = MockERC20(USDC_ADDR);
        garc   = MockERC20(GARC_ADDR);
        router = MockUniswapV2Router(ROUTER_ADDR);

        // 4. Deploy contract under test.
        buyback = new GMBuyback(owner, reserveVault);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /// Seed reserveVault with USDC and grant the buyback contract an allowance.
    function _fundVault(uint256 amount) internal {
        usdc.mint(reserveVault, amount);
        vm.prank(reserveVault);
        usdc.approve(address(buyback), amount);
    }

    /// Advance time by `periods` full cooldown periods.
    function _skipCooldowns(uint256 periods) internal {
        vm.warp(block.timestamp + DEFAULT_COOLDOWN * periods);
    }

    /// Execute a buyback as `caller` after funding the vault.
    function _executeBuyback(address caller, uint256 vaultBalance) internal {
        _fundVault(vaultBalance);
        vm.prank(caller);
        buyback.executeBuyback();
    }
}
