// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Mock IGMCheckIn for GMPartner unit tests.
contract MockGMCheckIn {
    uint256 public _checkinFee = 100_000;
    uint256 public partnerCheckinCallCount;
    address public lastPartnerCheckinUser;

    function partnerCheckin(address user) external {
        partnerCheckinCallCount++;
        lastPartnerCheckinUser = user;
    }

    function checkinFee() external view returns (uint256) {
        return _checkinFee;
    }

    // ── Test helpers ──────────────────────────────────────────────────────

    function setCheckinFee(uint256 fee) external {
        _checkinFee = fee;
    }
}
