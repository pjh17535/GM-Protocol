// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MockERC20} from "./MockERC20.sol";

/// @dev Mock IGMBuyback for GMCheckIn v3 unit tests.
contract MockGMBuyback {
    bool public shouldRevert;
    bool public canExecuteFlag = true;
    uint256 public executeCallCount;

    // buybackAndBurn tracking (GMCheckIn v3.2 snapshot path)
    address public usdcAddr;
    uint256 public buybackAndBurnCallCount;
    uint256 public lastBuybackAmount;
    address public lastBuybackCaller;
    uint256 public totalPulled;
    uint256 public garcBurnedPerCall = 0; // returned value; 0 => echo usdcAmount * 1e12

    function setUsdc(address usdc_) external {
        usdcAddr = usdc_;
    }

    /// @dev Pulls USDC from caller (like the real contract) and "burns" it.
    function buybackAndBurn(uint256 usdcAmount) external returns (uint256) {
        if (shouldRevert) revert("MockGMBuyback: revert");
        if (usdcAddr != address(0)) {
            MockERC20(usdcAddr).transferFrom(msg.sender, address(this), usdcAmount);
        }
        buybackAndBurnCallCount++;
        lastBuybackAmount = usdcAmount;
        lastBuybackCaller = msg.sender;
        totalPulled += usdcAmount;
        return garcBurnedPerCall == 0 ? usdcAmount * 1e12 : garcBurnedPerCall;
    }

    function setGarcBurnedPerCall(uint256 v) external {
        garcBurnedPerCall = v;
    }

    function executeBuyback() external {
        if (shouldRevert) revert("MockGMBuyback: revert");
        executeCallCount++;
    }

    function canExecute() external view returns (bool) {
        return canExecuteFlag;
    }

    // ── Test helpers ──────────────────────────────────────────────────────

    function setShouldRevert(bool flag) external {
        shouldRevert = flag;
    }

    function setCanExecute(bool flag) external {
        canExecuteFlag = flag;
    }
}
