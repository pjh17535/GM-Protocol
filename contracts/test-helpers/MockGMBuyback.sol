// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Mock IGMBuyback for GMCheckIn v3 unit tests.
contract MockGMBuyback {
    bool public shouldRevert;
    bool public canExecuteFlag = true;
    uint256 public executeCallCount;

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
