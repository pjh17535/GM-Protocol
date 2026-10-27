// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMSoulBoundTestBase} from "./GMSoulBound.Base.t.sol";
import {GMSoulBound} from "../GMSoulBound.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

// Re-declare the IERC5192 interface so we can reference its events in tests
interface IERC5192 is IERC165 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

// ─────────────────────────────────────────────────────────────────────────────
// Deployment & initialization
// ─────────────────────────────────────────────────────────────────────────────
contract GMSoulBound_Deploy_Test is GMSoulBoundTestBase {
    function test_Deploy_OwnerIsSet() public view {
        assertEq(nft.owner(), owner);
    }

    function test_Deploy_MinterIsSet() public view {
        assertEq(nft.minter(), minter);
    }

    function test_Deploy_NameAndSymbol() public view {
        assertEq(nft.name(), "GMSoulBound");
        assertEq(nft.symbol(), "GMSBT");
    }

    function test_Deploy_RevertsOnZeroMinter() public {
        vm.expectRevert(GMSoulBound.ZeroAddress.selector);
        new GMSoulBound(owner, address(0));
    }

    function test_Deploy_RevertsOnZeroOwner() public {
        // OZ Ownable reverts with OwnableInvalidOwner when initialOwner == address(0)
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableInvalidOwner.selector, address(0))
        );
        new GMSoulBound(address(0), minter);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// mint() — access control
// ─────────────────────────────────────────────────────────────────────────────
contract GMSoulBound_MintAccess_Test is GMSoulBoundTestBase {
    function test_Mint_OnlyMinterCanCall() public {
        vm.prank(minter);
        uint256 id = nft.mint(alice, BRONZE, "");
        assertEq(nft.ownerOf(id), alice);
    }

    function test_Mint_NonMinterReverts() public {
        vm.prank(alice);
        vm.expectRevert(GMSoulBound.NotMinter.selector);
        nft.mint(alice, BRONZE, "");
    }

    function test_Mint_OwnerIsNotMinterByDefault() public {
        vm.prank(owner);
        vm.expectRevert(GMSoulBound.NotMinter.selector);
        nft.mint(alice, BRONZE, "");
    }

    function test_Mint_RevertsOnZeroRecipient() public {
        vm.prank(minter);
        vm.expectRevert(GMSoulBound.ZeroAddress.selector);
        nft.mint(address(0), BRONZE, "");
    }

    function test_Mint_RevertsOnInvalidTier() public {
        vm.prank(minter);
        vm.expectRevert(
            abi.encodeWithSelector(GMSoulBound.InvalidTier.selector, uint8(5))
        );
        nft.mint(alice, 5, "");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// mint() — correct data storage
// ─────────────────────────────────────────────────────────────────────────────
contract GMSoulBound_MintData_Test is GMSoulBoundTestBase {
    function test_Mint_StoresTierAndOwner() public {
        uint256 id = _mint(alice, GOLD, "");
        (uint8 tier, address tokenOwner,,) = nft.getTokenInfo(id);
        assertEq(tier, GOLD);
        assertEq(tokenOwner, alice);
    }

    function test_Mint_StoresMintedAt() public {
        uint256 ts = 1_700_000_000;
        vm.warp(ts);
        uint256 id = _mint(alice, BRONZE, "");
        (,, uint256 mintedAt,) = nft.getTokenInfo(id);
        assertEq(mintedAt, ts);
    }

    function test_Mint_StoresPartnerNameForPartnerTier() public {
        uint256 id = _mint(alice, PARTNER, "Acme Corp");
        (,,, string memory pName) = nft.getTokenInfo(id);
        assertEq(pName, "Acme Corp");
    }

    function test_Mint_PartnerNameEmptyForNonPartnerTier() public {
        uint256 id = _mint(alice, BRONZE, "ShouldBeIgnored");
        (,,, string memory pName) = nft.getTokenInfo(id);
        assertEq(pName, "");
    }

    function test_Mint_TokenIdAutoIncrements() public {
        uint256 id1 = _mint(alice, BRONZE, "");
        uint256 id2 = _mint(alice, GOLD, "");
        uint256 id3 = _mint(bob,   PLATINUM, "");
        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(id3, 3);
    }

    function test_Mint_SameAddressSameTierMultipleTimes() public {
        // Allowed by design — no per-tier uniqueness restriction
        uint256 id1 = _mint(alice, GOLD, "");
        uint256 id2 = _mint(alice, GOLD, "");
        assertNotEq(id1, id2);
        assertEq(nft.ownerOf(id1), alice);
        assertEq(nft.ownerOf(id2), alice);
    }

    function test_Mint_EmitsLockedEvent() public {
        vm.prank(minter);
        vm.expectEmit(true, false, false, false, address(nft));
        emit IERC5192.Locked(1); // next tokenId will be 1
        nft.mint(alice, BRONZE, "");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Soulbound: transfer / approve functions all revert
// ─────────────────────────────────────────────────────────────────────────────
contract GMSoulBound_Soulbound_Test is GMSoulBoundTestBase {
    uint256 internal tokenId;

    function setUp() public override {
        super.setUp();
        tokenId = _mint(alice, BRONZE, "");
    }

    function test_TransferFrom_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(GMSoulBound.SoulboundNonTransferable.selector);
        nft.transferFrom(alice, bob, tokenId);
    }

    function test_SafeTransferFrom_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(GMSoulBound.SoulboundNonTransferable.selector);
        nft.safeTransferFrom(alice, bob, tokenId, "");
    }

    function test_Approve_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(GMSoulBound.SoulboundNonTransferable.selector);
        nft.approve(bob, tokenId);
    }

    function test_SetApprovalForAll_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(GMSoulBound.SoulboundNonTransferable.selector);
        nft.setApprovalForAll(bob, true);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// locked()
// ─────────────────────────────────────────────────────────────────────────────
contract GMSoulBound_Locked_Test is GMSoulBoundTestBase {
    function test_Locked_ReturnsTrue() public {
        uint256 id = _mint(alice, BRONZE, "");
        assertTrue(nft.locked(id));
    }

    function test_Locked_RevertsForNonExistentToken() public {
        vm.expectRevert(
            abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, uint256(999))
        );
        nft.locked(999);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// tokenURI() — all 5 tiers
// ─────────────────────────────────────────────────────────────────────────────
contract GMSoulBound_TokenURI_Test is GMSoulBoundTestBase {
    bytes internal constant PREFIX = bytes("data:application/json;base64,");

    function _assertValidURI(uint256 id) internal view {
        string memory uri = nft.tokenURI(id);
        bytes memory uriBytes = bytes(uri);

        // Non-empty
        assertGt(uriBytes.length, 0, "tokenURI is empty");

        // Starts with the expected data URI prefix
        assertTrue(uriBytes.length >= PREFIX.length, "tokenURI too short for prefix");
        for (uint256 i = 0; i < PREFIX.length; i++) {
            assertEq(uriBytes[i], PREFIX[i], "tokenURI prefix mismatch");
        }
    }

    function test_TokenURI_Bronze() public {
        uint256 id = _mint(alice, BRONZE, "");
        _assertValidURI(id);
    }

    function test_TokenURI_Gold() public {
        uint256 id = _mint(alice, GOLD, "");
        _assertValidURI(id);
    }

    function test_TokenURI_Platinum() public {
        uint256 id = _mint(alice, PLATINUM, "");
        _assertValidURI(id);
    }

    function test_TokenURI_Legend() public {
        uint256 id = _mint(alice, LEGEND, "");
        _assertValidURI(id);
    }

    function test_TokenURI_Partner() public {
        uint256 id = _mint(alice, PARTNER, "Acme Corp");
        _assertValidURI(id);
    }

    function test_TokenURI_RevertsForNonExistentToken() public {
        vm.expectRevert(
            abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, uint256(42))
        );
        nft.tokenURI(42);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// getUserTokens()
// ─────────────────────────────────────────────────────────────────────────────
contract GMSoulBound_GetUserTokens_Test is GMSoulBoundTestBase {
    function test_GetUserTokens_EmptyForNewAddress() public view {
        uint256[] memory tokens = nft.getUserTokens(alice);
        assertEq(tokens.length, 0);
    }

    function test_GetUserTokens_SingleMint() public {
        uint256 id = _mint(alice, BRONZE, "");
        uint256[] memory tokens = nft.getUserTokens(alice);
        assertEq(tokens.length, 1);
        assertEq(tokens[0], id);
    }

    function test_GetUserTokens_MultipleMints() public {
        uint256 id1 = _mint(alice, BRONZE, "");
        uint256 id2 = _mint(alice, GOLD, "");
        uint256 id3 = _mint(alice, PARTNER, "Test");
        uint256[] memory tokens = nft.getUserTokens(alice);
        assertEq(tokens.length, 3);
        assertEq(tokens[0], id1);
        assertEq(tokens[1], id2);
        assertEq(tokens[2], id3);
    }

    function test_GetUserTokens_DoesNotCrossAccounts() public {
        _mint(alice, BRONZE, "");
        _mint(bob, GOLD, "");
        uint256[] memory aliceTokens = nft.getUserTokens(alice);
        uint256[] memory bobTokens   = nft.getUserTokens(bob);
        assertEq(aliceTokens.length, 1);
        assertEq(bobTokens.length, 1);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// getTokenTier()
// ─────────────────────────────────────────────────────────────────────────────
contract GMSoulBound_GetTokenTier_Test is GMSoulBoundTestBase {
    function test_GetTokenTier_Bronze() public {
        uint256 id = _mint(alice, BRONZE, "");
        assertEq(nft.getTokenTier(id), BRONZE);
    }

    function test_GetTokenTier_Gold() public {
        uint256 id = _mint(alice, GOLD, "");
        assertEq(nft.getTokenTier(id), GOLD);
    }

    function test_GetTokenTier_Platinum() public {
        uint256 id = _mint(alice, PLATINUM, "");
        assertEq(nft.getTokenTier(id), PLATINUM);
    }

    function test_GetTokenTier_Legend() public {
        uint256 id = _mint(alice, LEGEND, "");
        assertEq(nft.getTokenTier(id), LEGEND);
    }

    function test_GetTokenTier_Partner() public {
        uint256 id = _mint(alice, PARTNER, "");
        assertEq(nft.getTokenTier(id), PARTNER);
    }

    function test_GetTokenTier_RevertsForNonExistent() public {
        vm.expectRevert(
            abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, uint256(77))
        );
        nft.getTokenTier(77);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// _sanitizePartnerName — via mint + getTokenInfo
// ─────────────────────────────────────────────────────────────────────────────
contract GMSoulBound_Sanitize_Test is GMSoulBoundTestBase {
    function test_Sanitize_AllowedCharsPassThrough() public {
        // alphanumeric, space (32), hyphen (45), period (46), underscore (95)
        uint256 id = _mint(alice, PARTNER, "Acme-Corp 1.0");
        (,,, string memory pName) = nft.getTokenInfo(id);
        assertEq(pName, "Acme-Corp 1.0");
    }

    function test_Sanitize_SpecialCharsReplacedWithUnderscore() public {
        // '<', '>', '!', '@' are all outside the allowed set → replaced with '_'
        uint256 id = _mint(alice, PARTNER, "<script>alert</");
        (,,, string memory pName) = nft.getTokenInfo(id);
        assertEq(pName, "_script_alert__");
    }

    function test_Sanitize_MixedChars() public {
        uint256 id = _mint(alice, PARTNER, "Hello! World#1");
        (,,, string memory pName) = nft.getTokenInfo(id);
        // '!' (33) and '#' (35) are not in allowed set → '_'
        assertEq(pName, "Hello_ World_1");
    }

    function test_Sanitize_TruncateTo32Chars() public {
        // 36-character string must be truncated to 32
        string memory long36 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456XX";
        uint256 id = _mint(alice, PARTNER, long36);
        (,,, string memory pName) = nft.getTokenInfo(id);
        assertEq(bytes(pName).length, 32);
        // First 32 chars of allowed input pass through unchanged
        assertEq(pName, "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456");
    }

    function test_Sanitize_EmptyPartnerName() public {
        uint256 id = _mint(alice, PARTNER, "");
        (,,, string memory pName) = nft.getTokenInfo(id);
        assertEq(pName, "");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// setMinter()
// ─────────────────────────────────────────────────────────────────────────────
contract GMSoulBound_SetMinter_Test is GMSoulBoundTestBase {
    function test_SetMinter_OwnerCanChange() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, false, address(nft));
        emit GMSoulBound.MinterUpdated(minter, charlie);
        nft.setMinter(charlie);
        assertEq(nft.minter(), charlie);
    }

    function test_SetMinter_NonOwnerReverts() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice)
        );
        nft.setMinter(charlie);
    }

    function test_SetMinter_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(GMSoulBound.ZeroAddress.selector);
        nft.setMinter(address(0));
    }

    function test_SetMinter_NewMinterCanMint() public {
        vm.prank(owner);
        nft.setMinter(charlie);

        vm.prank(charlie);
        uint256 id = nft.mint(alice, BRONZE, "");
        assertEq(nft.ownerOf(id), alice);
    }

    function test_SetMinter_OldMinterCanNoLongerMint() public {
        vm.prank(owner);
        nft.setMinter(charlie);

        vm.prank(minter);
        vm.expectRevert(GMSoulBound.NotMinter.selector);
        nft.mint(alice, BRONZE, "");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// supportsInterface()
// ─────────────────────────────────────────────────────────────────────────────
contract GMSoulBound_Interfaces_Test is GMSoulBoundTestBase {
    function test_SupportsERC721() public view {
        // ERC-721 interfaceId = 0x80ac58cd
        assertTrue(nft.supportsInterface(0x80ac58cd));
    }

    function test_SupportsERC165() public view {
        // ERC-165 interfaceId = 0x01ffc9a7
        assertTrue(nft.supportsInterface(0x01ffc9a7));
    }

    function test_SupportsIERC5192() public view {
        // IERC5192 interfaceId = type(IERC5192).interfaceId
        // = locked(uint256) selector = bytes4(keccak256("locked(uint256)"))
        bytes4 ierc5192 = bytes4(keccak256("locked(uint256)"));
        assertTrue(nft.supportsInterface(ierc5192));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fuzz: mint tokenId always increments monotonically
// ─────────────────────────────────────────────────────────────────────────────
contract GMSoulBound_Fuzz_Test is GMSoulBoundTestBase {
    function testFuzz_Mint_TokenIdAlwaysIncrements(uint8 tier1, uint8 tier2) public {
        tier1 = uint8(bound(tier1, 0, 4));
        tier2 = uint8(bound(tier2, 0, 4));

        uint256 id1 = _mint(alice, tier1, "");
        uint256 id2 = _mint(bob,   tier2, "");

        assertGt(id2, id1);
    }

    function testFuzz_Mint_GetTokenTierMatchesInput(uint8 tier) public {
        tier = uint8(bound(tier, 0, 4));
        uint256 id = _mint(alice, tier, "");
        assertEq(nft.getTokenTier(id), tier);
    }

    function testFuzz_Mint_GetUserTokensGrows(uint8 n) public {
        n = uint8(bound(n, 1, 20));
        for (uint256 i = 0; i < n; i++) {
            _mint(alice, BRONZE, "");
        }
        assertEq(nft.getUserTokens(alice).length, n);
    }
}
