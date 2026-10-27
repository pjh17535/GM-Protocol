// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GMSoulBound} from "../GMSoulBound.sol";

/// @dev Shared fixtures for all GMSoulBound test categories.
///      No test_ / testFuzz_ / invariant_ functions here — they would run
///      in every inheriting file (once per file is fine, but keep categories clean).
abstract contract GMSoulBoundTestBase is Test {
    GMSoulBound internal nft;

    address internal owner   = makeAddr("owner");
    address internal minter  = makeAddr("minter");
    address internal alice   = makeAddr("alice");
    address internal bob     = makeAddr("bob");
    address internal charlie = makeAddr("charlie");

    // Tier constants mirrored for readability in tests
    uint8 internal constant BRONZE  = 0;
    uint8 internal constant GOLD    = 1;
    uint8 internal constant PLATINUM = 2;
    uint8 internal constant LEGEND  = 3;
    uint8 internal constant PARTNER = 4;

    function setUp() public virtual {
        nft = new GMSoulBound(owner, minter);
    }

    /// @dev Helper: mint one token as the minter, return its tokenId.
    function _mint(address to, uint8 tier, string memory partnerName)
        internal
        returns (uint256 tokenId)
    {
        vm.prank(minter);
        tokenId = nft.mint(to, tier, partnerName);
    }
}
