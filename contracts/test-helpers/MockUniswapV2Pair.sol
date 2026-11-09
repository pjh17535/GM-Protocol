// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Minimal Uniswap V2 pair mock exposing only what GMCheckIn.gArcForUsdc reads.
///      Deployed at a normal address (lpPair is a constructor arg), so storage is fine.
contract MockUniswapV2Pair {
    address public token0;
    address public token1;
    uint112 private _reserve0;
    uint112 private _reserve1;

    constructor(address token0_, address token1_, uint112 reserve0_, uint112 reserve1_) {
        token0 = token0_;
        token1 = token1_;
        _reserve0 = reserve0_;
        _reserve1 = reserve1_;
    }

    function getReserves() external view returns (uint112, uint112, uint32) {
        return (_reserve0, _reserve1, 0);
    }

    function setReserves(uint112 r0, uint112 r1) external {
        _reserve0 = r0;
        _reserve1 = r1;
    }
}
