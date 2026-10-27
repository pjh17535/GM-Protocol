// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MockERC20} from "./MockERC20.sol";

/// @dev Minimal Uniswap V2 Router mock for GMBuyback unit tests.
///
///  IMPORTANT: this contract is deployed to a throwaway address then its
///  bytecode is vm.etch-ed onto the canonical router address.  vm.etch copies
///  only bytecode — NOT storage.  Therefore all mutable state is lost after
///  the etch.  The exchange rate is stored as a *constant* (embedded in
///  bytecode) so it survives the etch operation.
///
///  Rate: 2 000 gARC (18-decimal) per 1 USDC (1e6) → 2_000e18 per 1e6.
contract MockUniswapV2Router {
    /// @dev gARC per 1 USDC (in raw gARC base units, 18 decimals).
    ///      Constant → baked into bytecode → survives vm.etch.
    uint256 public constant GARC_OUT_PER_USDC = 2_000e18;

    /// @dev Returns [amountIn, garcOut] for a two-hop USDC→gARC path.
    function getAmountsOut(uint256 amountIn, address[] calldata /*path*/)
        external
        pure
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        // garcOut = amountIn * GARC_OUT_PER_USDC / 1e6
        amounts[1] = (amountIn * GARC_OUT_PER_USDC) / 1e6;
    }

    /// @dev Pulls USDC (path[0]) from msg.sender, mints gARC (path[1]) to `to`.
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 /*amountOutMin*/,
        address[] calldata path,
        address to,
        uint256 /*deadline*/
    ) external returns (uint256[] memory amounts) {
        // Pull USDC from the caller (GMBuyback has already approved us).
        MockERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

        // Compute and mint gARC to `to`.
        uint256 garcOut = (amountIn * GARC_OUT_PER_USDC) / 1e6;
        MockERC20(path[1]).mint(to, garcOut);

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = garcOut;
    }
}
