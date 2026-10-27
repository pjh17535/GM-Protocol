// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GMCheckInTestBase} from "./GMCheckIn.Base.t.sol";
import {GMCheckIn} from "../GMCheckIn.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract GMCheckInVerifyTest is GMCheckInTestBase {

    // ── Fixed test private key for signing ────────────────────────────────
    uint256 private constant SIGNER_PK = 0xA11CE;
    address private signerAddr;

    function setUp() public override {
        super.setUp();
        signerAddr = vm.addr(SIGNER_PK);
        // Point the contract's signer to our test key.
        vm.prank(owner);
        gm.setSigner(signerAddr);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /// Build a valid EIP-191 signed payload for `user` at `tier`.
    function _buildSig(address user, uint8 tier, uint256 deadline)
        internal
        view
        returns (bytes memory sig)
    {
        bytes32 msgHash = keccak256(
            abi.encodePacked(address(gm), user, tier, deadline, block.chainid)
        );
        bytes32 digest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SIGNER_PK, digest);
        return abi.encodePacked(r, s, v);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 28. Reverts on expired signature (SignatureExpired)
    // ─────────────────────────────────────────────────────────────────────

    function test_CompleteVerification_RevertsExpiredSignature() public {
        uint256 deadline = block.timestamp - 1; // already expired
        bytes memory sig = _buildSig(alice, BRONZE, deadline);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(GMCheckIn.SignatureExpired.selector, deadline)
        );
        gm.completeVerification(BRONZE, deadline, sig);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 29. Reverts on invalid signature (InvalidSignature)
    // ─────────────────────────────────────────────────────────────────────

    function test_CompleteVerification_RevertsInvalidSignature() public {
        uint256 deadline = block.timestamp + 3_600;
        // Sign with a different private key.
        uint256 wrongPk = 0xDEAD;
        bytes32 msgHash = keccak256(
            abi.encodePacked(address(gm), alice, BRONZE, deadline, block.chainid)
        );
        bytes32 digest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.prank(alice);
        vm.expectRevert(GMCheckIn.InvalidSignature.selector);
        gm.completeVerification(BRONZE, deadline, sig);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 30. Valid signature: updates verifiedLevel correctly
    // ─────────────────────────────────────────────────────────────────────

    function test_CompleteVerification_SetsLevelBronze() public {
        uint256 deadline = block.timestamp + 3_600;
        bytes memory sig = _buildSig(alice, BRONZE, deadline);

        vm.prank(alice);
        gm.completeVerification(BRONZE, deadline, sig);

        // Bronze requires level 1.
        assertEq(gm.verifiedLevel(alice), 1);
    }

    function test_CompleteVerification_SetsLevelGold() public {
        uint256 deadline = block.timestamp + 3_600;
        bytes memory sig = _buildSig(alice, GOLD, deadline);

        vm.prank(alice);
        gm.completeVerification(GOLD, deadline, sig);

        // Gold requires level 2.
        assertEq(gm.verifiedLevel(alice), 2);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 31. Verified level is cumulative (Legend=4 covers all lower tiers)
    // ─────────────────────────────────────────────────────────────────────

    function test_CompleteVerification_LegendCoversAllLevels() public {
        uint256 deadline = block.timestamp + 3_600;
        bytes memory sig = _buildSig(alice, LEGEND, deadline);

        vm.prank(alice);
        gm.completeVerification(LEGEND, deadline, sig);

        // Legend requires level 4 — should cover Bronze (1), Gold (2), Platinum (3).
        uint8 level = gm.verifiedLevel(alice);
        assertEq(level, 4);
        assertGe(level, 1); // covers Bronze
        assertGe(level, 2); // covers Gold
        assertGe(level, 3); // covers Platinum
    }

    function test_CompleteVerification_LevelNotDowngraded() public {
        // Verify as Gold (level 2), then try Bronze (level 1) — should stay at 2.
        uint256 deadline = block.timestamp + 3_600;
        bytes memory sigGold = _buildSig(alice, GOLD, deadline);

        vm.prank(alice);
        gm.completeVerification(GOLD, deadline, sigGold);
        assertEq(gm.verifiedLevel(alice), 2);

        // Now try Bronze — contract only updates if currentLevel < required.
        bytes memory sigBronze = _buildSig(alice, BRONZE, deadline);
        vm.prank(alice);
        gm.completeVerification(BRONZE, deadline, sigBronze);
        assertEq(gm.verifiedLevel(alice), 2); // unchanged
    }

    // ─────────────────────────────────────────────────────────────────────
    // 32. Same signature cannot be replayed for a different contract address
    // ─────────────────────────────────────────────────────────────────────

    function test_CompleteVerification_CannotReplayOnDifferentContract() public {
        uint256 deadline = block.timestamp + 3_600;
        // Deploy a second GMCheckIn instance that uses the same signer.
        GMCheckIn gm2 = new GMCheckIn(owner, address(gmPool), address(gmBuyback));
        vm.prank(owner);
        gm2.setSigner(signerAddr);

        // Signature bound to `gm` (not `gm2`).
        bytes memory sig = _buildSig(alice, BRONZE, deadline);

        // Using this sig on gm2 should fail because address(gm) != address(gm2)
        // in the hash payload.
        vm.prank(alice);
        vm.expectRevert(GMCheckIn.InvalidSignature.selector);
        gm2.completeVerification(BRONZE, deadline, sig);
    }

    // Emits VerificationCompleted
    function test_CompleteVerification_EmitsEvent() public {
        uint256 deadline = block.timestamp + 3_600;
        bytes memory sig = _buildSig(alice, BRONZE, deadline);

        vm.expectEmit(true, false, false, true, address(gm));
        emit GMCheckIn.VerificationCompleted(alice, BRONZE, uint8(1));

        vm.prank(alice);
        gm.completeVerification(BRONZE, deadline, sig);
    }

    // InvalidTier reverts
    function test_CompleteVerification_InvalidTierReverts() public {
        uint256 deadline = block.timestamp + 3_600;
        bytes memory sig = _buildSig(alice, 4, deadline);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(GMCheckIn.InvalidTier.selector, uint8(4)));
        gm.completeVerification(4, deadline, sig);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 34. Owner functions — only owner
    // ─────────────────────────────────────────────────────────────────────

    function test_SetCheckinFee_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        gm.setCheckinFee(200_000);
    }

    function test_SetCheckinFee_UpdatesValue() public {
        vm.prank(owner);
        gm.setCheckinFee(200_000);
        assertEq(gm.checkinFee(), 200_000);
    }

    function test_SetCheckinFee_EmitsEvent() public {
        vm.expectEmit(false, false, false, true, address(gm));
        emit GMCheckIn.CheckinFeeUpdated(100_000, 200_000);

        vm.prank(owner);
        gm.setCheckinFee(200_000);
    }

    function test_SetGMPool_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        gm.setGMPool(makeAddr("newPool"));
    }

    function test_SetGMPool_UpdatesAddress() public {
        address newPool = makeAddr("newPool");
        vm.prank(owner);
        gm.setGMPool(newPool);
        assertEq(address(gm.gmPool()), newPool);
    }

    function test_SetGMPool_RevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(GMCheckIn.ZeroAddress.selector);
        gm.setGMPool(address(0));
    }

    function test_SetGMBuyback_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        gm.setGMBuyback(makeAddr("newBuyback"));
    }

    function test_SetGMBuyback_UpdatesAddress() public {
        address newBuyback = makeAddr("newBuyback");
        vm.prank(owner);
        gm.setGMBuyback(newBuyback);
        assertEq(address(gm.gmBuyback()), newBuyback);
    }

    function test_SetGMBuyback_RevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(GMCheckIn.ZeroAddress.selector);
        gm.setGMBuyback(address(0));
    }

    function test_SetSigner_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        gm.setSigner(makeAddr("newSigner"));
    }

    function test_SetSigner_UpdatesAddress() public {
        address newSigner = makeAddr("newSigner");
        vm.prank(owner);
        gm.setSigner(newSigner);
        assertEq(gm.signer(), newSigner);
    }

    function test_SetSigner_RevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(GMCheckIn.ZeroAddress.selector);
        gm.setSigner(address(0));
    }

    function test_SetVerificationEnabled_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        gm.setVerificationEnabled(true);
    }

    function test_SetVerificationEnabled_UpdatesFlag() public {
        assertFalse(gm.verificationEnabled());
        vm.prank(owner);
        gm.setVerificationEnabled(true);
        assertTrue(gm.verificationEnabled());
        vm.prank(owner);
        gm.setVerificationEnabled(false);
        assertFalse(gm.verificationEnabled());
    }

    // ─────────────────────────────────────────────────────────────────────
    // Constructor validation
    // ─────────────────────────────────────────────────────────────────────

    function test_Constructor_RevertsZeroPool() public {
        vm.expectRevert(GMCheckIn.ZeroAddress.selector);
        new GMCheckIn(owner, address(0), address(gmBuyback));
    }

    function test_Constructor_RevertsZeroBuyback() public {
        vm.expectRevert(GMCheckIn.ZeroAddress.selector);
        new GMCheckIn(owner, address(gmPool), address(0));
    }

    function test_Constructor_SetsInitialState() public view {
        assertEq(address(gm.gmPool()), address(gmPool));
        assertEq(address(gm.gmBuyback()), address(gmBuyback));
        assertEq(gm.checkinFee(), 100_000);
        assertFalse(gm.verificationEnabled());
        // signer was changed to signerAddr in setUp; just check it's not zero
        assertNotEq(gm.signer(), address(0));
    }
}
