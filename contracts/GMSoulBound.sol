// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

interface IERC5192 is IERC165 {
    /// @notice Emitted when a token is locked.
    event Locked(uint256 tokenId);

    /// @notice Emitted when a token is unlocked.
    event Unlocked(uint256 tokenId);

    /// @notice Returns the locking status of an NFT.
    function locked(uint256 tokenId) external view returns (bool);
}

contract GMSoulBound is ERC721, Ownable, IERC5192 {
    using Strings for uint256;

    uint8 public constant BRONZE = 0;
    uint8 public constant GOLD = 1;
    uint8 public constant PLATINUM = 2;
    uint8 public constant LEGEND = 3;
    uint8 public constant PARTNER = 4;
    uint8 public constant TIER_COUNT = 5;

    struct TokenData {
        uint8 tier;
        address owner;
        uint256 mintedAt;
        string partnerName;
    }

    address public minter;

    uint256 private _nextTokenId;
    mapping(uint256 tokenId => TokenData) private _tokenData;
    mapping(address user => uint256[]) private _userTokens;

    error SoulboundNonTransferable();
    error InvalidTier(uint8 tier);
    error NotMinter();
    error ZeroAddress();

    event MinterUpdated(address indexed oldMinter, address indexed newMinter);

    modifier onlyMinter() {
        if (msg.sender != minter) revert NotMinter();
        _;
    }

    constructor(address initialOwner, address initialMinter) ERC721("GMSoulBound", "GMSBT") Ownable(initialOwner) {
        if (initialMinter == address(0)) revert ZeroAddress();
        minter = initialMinter;
    }

    function setMinter(address newMinter) external onlyOwner {
        if (newMinter == address(0)) revert ZeroAddress();

        address oldMinter = minter;
        minter = newMinter;

        emit MinterUpdated(oldMinter, newMinter);
    }

    function mint(address to, uint8 tier, string calldata partnerName) external onlyMinter returns (uint256 tokenId) {
        if (to == address(0)) revert ZeroAddress();
        if (tier >= TIER_COUNT) revert InvalidTier(tier);

        string memory sanitizedPartnerName = _sanitizePartnerName(partnerName);

        tokenId = ++_nextTokenId;

        _mint(to, tokenId);

        string memory storedPartnerName = tier == PARTNER ? sanitizedPartnerName : "";
        _tokenData[tokenId] = TokenData({tier: tier, owner: to, mintedAt: block.timestamp, partnerName: storedPartnerName});
        _userTokens[to].push(tokenId);

        emit Locked(tokenId);
    }

    function locked(uint256 tokenId) external view override returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert ERC721NonexistentToken(tokenId);
        return true;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert ERC721NonexistentToken(tokenId);

        TokenData storage data = _tokenData[tokenId];

        string memory tierName = _tierLabel(data.tier);
        string memory requiredDays = _requiredDaysLabel(data.tier);
        string memory svg = _generateSVG(data.tier, data.partnerName);
        string memory image = string.concat("data:image/svg+xml;base64,", Base64.encode(bytes(svg)));

        string memory json = string.concat(
            '{"name":"GM Protocol - ',
            tierName,
            '","description":"',
            _descriptionForTier(data.tier, data.partnerName),
            '","image":"',
            image,
            '","attributes":[{"trait_type":"Tier","value":"',
            _tierAttributeValue(data.tier),
            '"},{"trait_type":"Required Days","value":"',
            requiredDays,
            '"},{"trait_type":"Chain","value":"Arc Network"}]}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function getUserTokens(address user) external view returns (uint256[] memory) {
        return _userTokens[user];
    }

    function getTokenTier(uint256 tokenId) external view returns (uint8) {
        if (_ownerOf(tokenId) == address(0)) revert ERC721NonexistentToken(tokenId);
        return _tokenData[tokenId].tier;
    }

    function getTokenInfo(
        uint256 tokenId
    ) external view returns (uint8 tier, address owner, uint256 mintedAt, string memory partnerName) {
        if (_ownerOf(tokenId) == address(0)) revert ERC721NonexistentToken(tokenId);
        TokenData storage data = _tokenData[tokenId];
        return (data.tier, data.owner, data.mintedAt, data.partnerName);
    }

    function transferFrom(address, address, uint256) public pure override {
        revert SoulboundNonTransferable();
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert SoulboundNonTransferable();
    }

    function approve(address, uint256) public pure override {
        revert SoulboundNonTransferable();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundNonTransferable();
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }

    function _sanitizePartnerName(string memory input) internal pure returns (string memory) {
        bytes memory source = bytes(input);
        uint256 sourceLength = source.length;
        if (sourceLength > 32) sourceLength = 32;

        bytes memory sanitized = new bytes(sourceLength);

        for (uint256 i = 0; i < sourceLength; i++) {
            bytes1 char = source[i];
            uint8 charCode = uint8(char);

            bool isAllowed =
                charCode == 32 ||
                charCode == 45 ||
                charCode == 46 ||
                (charCode >= 48 && charCode <= 57) ||
                (charCode >= 65 && charCode <= 90) ||
                charCode == 95 ||
                (charCode >= 97 && charCode <= 122);

            sanitized[i] = isAllowed ? char : bytes1("_");
        }

        return string(sanitized);
    }

    function _tierLabel(uint8 tier) internal pure returns (string memory) {
        if (tier == BRONZE) return "BRONZE";
        if (tier == GOLD) return "GOLD";
        if (tier == PLATINUM) return "PLATINUM";
        if (tier == LEGEND) return "LEGEND";
        if (tier == PARTNER) return "PARTNER";
        revert InvalidTier(tier);
    }

    function _tierAttributeValue(uint8 tier) internal pure returns (string memory) {
        if (tier == BRONZE) return "Bronze";
        if (tier == GOLD) return "Gold";
        if (tier == PLATINUM) return "Platinum";
        if (tier == LEGEND) return "Legend";
        if (tier == PARTNER) return "Partner";
        revert InvalidTier(tier);
    }

    function _requiredDaysLabel(uint8 tier) internal pure returns (string memory) {
        if (tier == BRONZE) return "30";
        if (tier == GOLD) return "90";
        if (tier == PLATINUM) return "180";
        if (tier == LEGEND) return "365";
        if (tier == PARTNER) return "Partner Milestone";
        revert InvalidTier(tier);
    }

    function _descriptionForTier(uint8 tier, string memory partnerName) internal pure returns (string memory) {
        if (tier == BRONZE) {
            return "Soulbound milestone badge for 30 consecutive GM check-ins on GM Protocol, built on Arc Network.";
        }
        if (tier == GOLD) {
            return "Soulbound milestone badge for 90 consecutive GM check-ins on GM Protocol, built on Arc Network.";
        }
        if (tier == PLATINUM) {
            return "Soulbound milestone badge for 180 consecutive GM check-ins on GM Protocol, built on Arc Network.";
        }
        if (tier == LEGEND) {
            return "Soulbound milestone badge for 365 consecutive GM check-ins on GM Protocol, built on Arc Network.";
        }
        if (tier == PARTNER) {
            if (bytes(partnerName).length == 0) {
                return "Soulbound partner milestone badge for GM Protocol, built on Arc Network.";
            }
            return string.concat(
                "Soulbound partner milestone badge for ",
                partnerName,
                " on GM Protocol, built on Arc Network."
            );
        }
        revert InvalidTier(tier);
    }

    function _generateSVG(uint8 tier, string memory partnerName) internal pure returns (string memory) {
        if (tier == BRONZE) {
            return
                '<svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">'
                '<defs>'
                '<radialGradient id="bg" cx="50%" cy="55%" r="65%"><stop offset="0%" stop-color="#3E2B63"/><stop offset="100%" stop-color="#1B3158"/></radialGradient>'
                '<linearGradient id="tier" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#CD7F32"/><stop offset="100%" stop-color="#A0522D"/></linearGradient>'
                '<linearGradient id="arc" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#CD7F32"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient>'
                '<filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
                '</defs>'
                '<rect width="280" height="280" rx="24" fill="url(#bg)"/>'
                '<rect width="280" height="6" rx="3" fill="url(#tier)"/>'
                '<rect y="274" width="280" height="6" rx="3" fill="url(#tier)"/>'
                '<path d="M40 155 Q140 60 240 155" stroke="url(#arc)" stroke-width="3" fill="none" stroke-linecap="round" filter="url(#glow)"/>'
                '<line x1="30" y1="168" x2="250" y2="168" stroke="#CD7F32" stroke-width="1.5" stroke-opacity="0.5"/>'
                '<circle cx="140" cy="108" r="18" fill="#CD7F32" fill-opacity="0.15" stroke="#CD7F32" stroke-width="1.5" stroke-opacity="0.6"/>'
                '<circle cx="140" cy="108" r="10" fill="#CD7F32" fill-opacity="0.3"/>'
                '<circle cx="140" cy="140" r="38" fill="#1B3158" fill-opacity="0.6" stroke="#CD7F32" stroke-width="2" stroke-opacity="0.8"/>'
                '<text x="140" y="150" text-anchor="middle" font-size="32" font-weight="800" font-family="system-ui,sans-serif" fill="white" letter-spacing="-1">GM</text>'
                '<circle cx="140" cy="210" r="16" stroke="#CD7F32" stroke-width="1.5" fill="none" stroke-opacity="0.8"/>'
                '<circle cx="140" cy="210" r="9" stroke="#CD7F32" stroke-width="1.2" fill="none" stroke-opacity="0.5"/>'
                '<circle cx="140" cy="210" r="3.5" fill="#CD7F32" fill-opacity="0.7"/>'
                '<text x="140" y="245" text-anchor="middle" font-size="18" font-weight="700" font-family="system-ui,sans-serif" fill="#CD7F32" letter-spacing="3">BRONZE</text>'
                '<text x="140" y="264" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="#CD7F32" fill-opacity="0.7" letter-spacing="1">30 DAYS . GM PROTOCOL</text>'
                '<text x="140" y="28" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="white" fill-opacity="0.5" letter-spacing="2">BUILT ON ARC</text>'
                '<line x1="20" y1="140" x2="85" y2="140" stroke="#CD7F32" stroke-width="1" stroke-opacity="0.3"/>'
                '<line x1="195" y1="140" x2="260" y2="140" stroke="#CD7F32" stroke-width="1" stroke-opacity="0.3"/>'
                '</svg>';
        }

        if (tier == GOLD) {
            return
                '<svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">'
                '<defs>'
                '<radialGradient id="bg" cx="50%" cy="55%" r="65%"><stop offset="0%" stop-color="#3E2B63"/><stop offset="100%" stop-color="#1B3158"/></radialGradient>'
                '<linearGradient id="tier" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#EF4444"/></linearGradient>'
                '<filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
                '</defs>'
                '<rect width="280" height="280" rx="24" fill="url(#bg)"/>'
                '<rect width="280" height="6" rx="3" fill="url(#tier)"/>'
                '<rect y="274" width="280" height="6" rx="3" fill="url(#tier)"/>'
                '<path d="M40 155 Q140 60 240 155" stroke="url(#tier)" stroke-width="3" fill="none" stroke-linecap="round" filter="url(#glow)"/>'
                '<path d="M55 165 Q140 80 225 165" stroke="#F59E0B" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-opacity="0.4"/>'
                '<line x1="30" y1="168" x2="250" y2="168" stroke="#F59E0B" stroke-width="1.5" stroke-opacity="0.5"/>'
                '<circle cx="140" cy="108" r="20" fill="#F59E0B" fill-opacity="0.2" stroke="#F59E0B" stroke-width="2" stroke-opacity="0.7" filter="url(#glow)"/>'
                '<circle cx="140" cy="108" r="11" fill="#F59E0B" fill-opacity="0.4"/>'
                '<circle cx="140" cy="140" r="38" fill="#1B3158" fill-opacity="0.6" stroke="#F59E0B" stroke-width="2.5" stroke-opacity="0.9"/>'
                '<text x="140" y="150" text-anchor="middle" font-size="32" font-weight="800" font-family="system-ui,sans-serif" fill="white" letter-spacing="-1">GM</text>'
                '<circle cx="140" cy="210" r="16" stroke="#F59E0B" stroke-width="1.5" fill="none" stroke-opacity="0.9" filter="url(#glow)"/>'
                '<circle cx="140" cy="210" r="9" stroke="#F59E0B" stroke-width="1.2" fill="none" stroke-opacity="0.6"/>'
                '<circle cx="140" cy="210" r="3.5" fill="#F59E0B"/>'
                '<text x="140" y="245" text-anchor="middle" font-size="18" font-weight="700" font-family="system-ui,sans-serif" fill="#F59E0B" letter-spacing="3">GOLD</text>'
                '<text x="140" y="264" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="#F59E0B" fill-opacity="0.7" letter-spacing="1">90 DAYS . GM PROTOCOL</text>'
                '<text x="140" y="28" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="white" fill-opacity="0.5" letter-spacing="2">BUILT ON ARC</text>'
                '<line x1="20" y1="140" x2="85" y2="140" stroke="#F59E0B" stroke-width="1" stroke-opacity="0.4"/>'
                '<line x1="195" y1="140" x2="260" y2="140" stroke="#F59E0B" stroke-width="1" stroke-opacity="0.4"/>'
                '</svg>';
        }

        if (tier == PLATINUM) {
            return
                '<svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">'
                '<defs>'
                '<radialGradient id="bg" cx="50%" cy="55%" r="65%"><stop offset="0%" stop-color="#2D1F4E"/><stop offset="100%" stop-color="#0F2040"/></radialGradient>'
                '<linearGradient id="tier" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#E2E8F0"/><stop offset="50%" stop-color="#94A3B8"/><stop offset="100%" stop-color="#CBD5E1"/></linearGradient>'
                '<filter id="glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
                '</defs>'
                '<rect width="280" height="280" rx="24" fill="url(#bg)"/>'
                '<rect width="280" height="6" rx="3" fill="url(#tier)"/>'
                '<rect y="274" width="280" height="6" rx="3" fill="url(#tier)"/>'
                '<path d="M40 155 Q140 60 240 155" stroke="url(#tier)" stroke-width="3" fill="none" stroke-linecap="round" filter="url(#glow)"/>'
                '<path d="M55 165 Q140 80 225 165" stroke="#94A3B8" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-opacity="0.5"/>'
                '<path d="M70 172 Q140 95 210 172" stroke="#CBD5E1" stroke-width="1" fill="none" stroke-linecap="round" stroke-opacity="0.3"/>'
                '<line x1="30" y1="168" x2="250" y2="168" stroke="#94A3B8" stroke-width="1.5" stroke-opacity="0.4"/>'
                '<circle cx="140" cy="108" r="22" fill="#94A3B8" fill-opacity="0.15" stroke="#E2E8F0" stroke-width="2" stroke-opacity="0.6" filter="url(#glow)"/>'
                '<circle cx="140" cy="108" r="12" fill="#94A3B8" fill-opacity="0.3"/>'
                '<circle cx="140" cy="140" r="38" fill="#0F2040" fill-opacity="0.7" stroke="url(#tier)" stroke-width="2.5"/>'
                '<text x="140" y="150" text-anchor="middle" font-size="32" font-weight="800" font-family="system-ui,sans-serif" fill="white" letter-spacing="-1">GM</text>'
                '<circle cx="140" cy="210" r="16" stroke="#E2E8F0" stroke-width="1.5" fill="none" stroke-opacity="0.8" filter="url(#glow)"/>'
                '<circle cx="140" cy="210" r="9" stroke="#94A3B8" stroke-width="1.2" fill="none" stroke-opacity="0.6"/>'
                '<circle cx="140" cy="210" r="3.5" fill="#E2E8F0" fill-opacity="0.9"/>'
                '<text x="140" y="245" text-anchor="middle" font-size="17" font-weight="700" font-family="system-ui,sans-serif" fill="#E2E8F0" letter-spacing="3">PLATINUM</text>'
                '<text x="140" y="264" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="#94A3B8" fill-opacity="0.8" letter-spacing="1">180 DAYS . GM PROTOCOL</text>'
                '<text x="140" y="28" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="white" fill-opacity="0.5" letter-spacing="2">BUILT ON ARC</text>'
                '<line x1="20" y1="140" x2="85" y2="140" stroke="#94A3B8" stroke-width="1" stroke-opacity="0.3"/>'
                '<line x1="195" y1="140" x2="260" y2="140" stroke="#94A3B8" stroke-width="1" stroke-opacity="0.3"/>'
                '</svg>';
        }

        if (tier == LEGEND) {
            return
                '<svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">'
                '<defs>'
                '<radialGradient id="bg" cx="50%" cy="55%" r="65%"><stop offset="0%" stop-color="#4C1D95"/><stop offset="60%" stop-color="#1E1B4B"/><stop offset="100%" stop-color="#0F172A"/></radialGradient>'
                '<linearGradient id="tier" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#A855F7"/><stop offset="50%" stop-color="#EC4899"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient>'
                '<filter id="glow"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
                '</defs>'
                '<rect width="280" height="280" rx="24" fill="url(#bg)"/>'
                '<rect width="280" height="6" rx="3" fill="url(#tier)"/>'
                '<rect y="274" width="280" height="6" rx="3" fill="url(#tier)"/>'
                '<circle cx="30" cy="50" r="1.5" fill="white" fill-opacity="0.4"/>'
                '<circle cx="60" cy="30" r="1.5" fill="white" fill-opacity="0.4"/>'
                '<circle cx="250" cy="45" r="1.5" fill="white" fill-opacity="0.4"/>'
                '<circle cx="220" cy="25" r="1.5" fill="white" fill-opacity="0.4"/>'
                '<circle cx="15" cy="200" r="1.5" fill="white" fill-opacity="0.4"/>'
                '<circle cx="265" cy="180" r="1.5" fill="white" fill-opacity="0.4"/>'
                '<circle cx="45" cy="240" r="1.5" fill="white" fill-opacity="0.4"/>'
                '<circle cx="240" cy="250" r="1.5" fill="white" fill-opacity="0.4"/>'
                '<path d="M40 155 Q140 60 240 155" stroke="url(#tier)" stroke-width="3.5" fill="none" stroke-linecap="round" filter="url(#glow)"/>'
                '<path d="M55 165 Q140 80 225 165" stroke="#A855F7" stroke-width="2" fill="none" stroke-linecap="round" stroke-opacity="0.6"/>'
                '<path d="M70 172 Q140 95 210 172" stroke="#EC4899" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-opacity="0.4"/>'
                '<path d="M85 178 Q140 108 195 178" stroke="#F59E0B" stroke-width="1" fill="none" stroke-linecap="round" stroke-opacity="0.3"/>'
                '<line x1="30" y1="168" x2="250" y2="168" stroke="#A855F7" stroke-width="1.5" stroke-opacity="0.4"/>'
                '<circle cx="140" cy="108" r="24" fill="#A855F7" fill-opacity="0.2" stroke="url(#tier)" stroke-width="2" filter="url(#glow)"/>'
                '<circle cx="140" cy="108" r="13" fill="#A855F7" fill-opacity="0.4"/>'
                '<circle cx="140" cy="140" r="40" fill="#0F172A" fill-opacity="0.8" stroke="url(#tier)" stroke-width="3" filter="url(#glow)"/>'
                '<text x="140" y="150" text-anchor="middle" font-size="32" font-weight="800" font-family="system-ui,sans-serif" fill="white" letter-spacing="-1">GM</text>'
                '<circle cx="140" cy="210" r="16" stroke="url(#tier)" stroke-width="2" fill="none" filter="url(#glow)"/>'
                '<circle cx="140" cy="210" r="9" stroke="#A855F7" stroke-width="1.5" fill="none" stroke-opacity="0.7"/>'
                '<circle cx="140" cy="210" r="3.5" fill="#A855F7"/>'
                '<text x="140" y="245" text-anchor="middle" font-size="17" font-weight="700" font-family="system-ui,sans-serif" fill="#A855F7" letter-spacing="3">LEGEND</text>'
                '<text x="140" y="264" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="#A855F7" fill-opacity="0.7" letter-spacing="1">365 DAYS . GM PROTOCOL</text>'
                '<text x="140" y="28" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="white" fill-opacity="0.6" letter-spacing="2">BUILT ON ARC</text>'
                '<line x1="20" y1="140" x2="85" y2="140" stroke="url(#tier)" stroke-width="1" stroke-opacity="0.5"/>'
                '<line x1="195" y1="140" x2="260" y2="140" stroke="url(#tier)" stroke-width="1" stroke-opacity="0.5"/>'
                '</svg>';
        }

        if (tier == PARTNER) {
            return
                string.concat(
                    '<svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">'
                    '<defs>'
                    '<radialGradient id="bg" cx="50%" cy="55%" r="65%"><stop offset="0%" stop-color="#1E3A5F"/><stop offset="100%" stop-color="#0D1F35"/></radialGradient>'
                    '<linearGradient id="tier" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0EA5E9"/></linearGradient>'
                    '</defs>'
                    '<rect width="280" height="280" rx="24" fill="url(#bg)"/>'
                    '<rect width="280" height="6" rx="3" fill="url(#tier)"/>'
                    '<rect y="274" width="280" height="6" rx="3" fill="url(#tier)"/>'
                    '<path d="M40 145 Q140 55 240 145" stroke="url(#tier)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-opacity="0.7"/>'
                    '<line x1="30" y1="158" x2="250" y2="158" stroke="#38BDF8" stroke-width="1" stroke-opacity="0.3"/>'
                    '<rect x="95" y="55" width="90" height="70" rx="12" fill="#0D1F35" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="4 3" stroke-opacity="0.5"/>'
                    '<text x="140" y="86" text-anchor="middle" font-size="9" font-family="system-ui,sans-serif" fill="#38BDF8" fill-opacity="0.5" letter-spacing="1">PARTNER</text>'
                    '<text x="140" y="100" text-anchor="middle" font-size="9" font-family="system-ui,sans-serif" fill="#38BDF8" fill-opacity="0.5" letter-spacing="1">LOGO HERE</text>'
                    '<circle cx="140" cy="168" r="32" fill="#0D1F35" fill-opacity="0.8" stroke="#38BDF8" stroke-width="1.5" stroke-opacity="0.6"/>'
                    '<text x="140" y="178" text-anchor="middle" font-size="26" font-weight="800" font-family="system-ui,sans-serif" fill="white" letter-spacing="-1">GM</text>'
                    '<circle cx="140" cy="222" r="13" stroke="#38BDF8" stroke-width="1.2" fill="none" stroke-opacity="0.7"/>'
                    '<circle cx="140" cy="222" r="7" stroke="#38BDF8" stroke-width="1" fill="none" stroke-opacity="0.4"/>'
                    '<circle cx="140" cy="222" r="2.5" fill="#38BDF8" fill-opacity="0.7"/>'
                    '<rect x="60" y="240" width="160" height="22" rx="4" fill="#38BDF8" fill-opacity="0.08" stroke="#38BDF8" stroke-width="1" stroke-dasharray="3 3" stroke-opacity="0.3"/>'
                    '<text x="140" y="255" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="#38BDF8" fill-opacity="0.8" letter-spacing="2">',
                    partnerName,
                    '</text>'
                    '<text x="140" y="28" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="white" fill-opacity="0.5" letter-spacing="2">BUILT ON ARC</text>'
                    '<line x1="20" y1="168" x2="90" y2="168" stroke="#38BDF8" stroke-width="1" stroke-opacity="0.2"/>'
                    '<line x1="190" y1="168" x2="260" y2="168" stroke="#38BDF8" stroke-width="1" stroke-opacity="0.2"/>'
                    '</svg>'
                );
        }

        revert InvalidTier(tier);
    }
}
