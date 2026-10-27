// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MockERC20} from "./MockERC20.sol";

/// @dev Mock IGMPool for GMCheckIn v3 unit tests.
///      Stores a per-poolId balance that tests can seed directly.
///      withdrawReward / withdrawGArc transfer tokens from this contract's
///      own balances, so tests must seed those balances with mint().
contract MockGMPool {
    // Addresses of the two tokens (set by the test setUp after vm.etch)
    address public usdcAddr;
    address public gArcAddr;

    // Simulated pool balances (poolId => balance)
    mapping(uint8 => uint256) private _poolBalance;

    // Whether to revert on receiveCheckinFee
    bool public revertOnReceive;

    constructor(address _usdc, address _garc) {
        usdcAddr = _usdc;
        gArcAddr = _garc;
    }

    // ── IGMPool interface ─────────────────────────────────────────────────

    function receiveCheckinFee(uint256 /*amount*/) external {
        if (revertOnReceive) revert("MockGMPool: revert");
    }

    function withdrawReward(uint256 amount, address to) external {
        MockERC20(usdcAddr).mint(to, amount);
    }

    function withdrawGArc(uint256 amount, address to) external {
        MockERC20(gArcAddr).mint(to, amount);
    }

    function poolBalance(uint8 poolId) external view returns (uint256) {
        return _poolBalance[poolId];
    }

    function gArcClaimBalance() external view returns (uint256) {
        return MockERC20(gArcAddr).balanceOf(address(this));
    }

    // ── Test helpers ──────────────────────────────────────────────────────

    /// Set the simulated pool balance for a given pool slot.
    function setPoolBalance(uint8 poolId, uint256 amount) external {
        _poolBalance[poolId] = amount;
    }

    /// Toggle whether receiveCheckinFee should revert.
    function setRevertOnReceive(bool flag) external {
        revertOnReceive = flag;
    }
}
