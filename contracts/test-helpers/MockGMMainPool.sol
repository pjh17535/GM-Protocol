// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MockERC20} from "./MockERC20.sol";

/// @dev Mock IGMMainPool for GMPartner unit tests.
///      injectFunds pulls USDC via transferFrom (the caller must have approved).
contract MockGMMainPool {
    address public usdcAddr;
    uint256 public totalInjected;
    uint256 public injectCallCount;
    uint256 public lastInjectedAmount;

    constructor(address _usdc) {
        usdcAddr = _usdc;
    }

    function injectFunds(uint256 amount) external {
        // Pull the USDC from the caller (GMPartner does forceApprove first)
        MockERC20(usdcAddr).transferFrom(msg.sender, address(this), amount);
        totalInjected += amount;
        injectCallCount++;
        lastInjectedAmount = amount;
    }
}
