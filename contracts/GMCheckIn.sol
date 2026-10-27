// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

interface IGMPool {
    function receiveCheckinFee(uint256 amount) external;
    function withdrawReward(uint256 amount, address to) external;
    function withdrawGArc(uint256 amount, address to) external;
    function poolBalance(uint8 poolId) external view returns (uint256);
    function gArcClaimBalance() external view returns (uint256);
}

interface IGMBuyback {
    function executeBuyback() external;
    function canExecute() external view returns (bool);
}

interface IGMSoulBound {
    function mint(address to, uint8 tier, string calldata partnerName) external returns (uint256);
}

contract GMCheckIn is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant DAY_SECONDS = 86400;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    uint8 public constant TIER_BRONZE = 0;
    uint8 public constant TIER_GOLD = 1;
    uint8 public constant TIER_PLATINUM = 2;
    uint8 public constant TIER_LEGEND = 3;
    uint8 public constant TIER_COUNT = 4;

    uint256 private constant BUYBACK_USER_PARTS = 8;
    uint256 private constant BUYBACK_TOTAL_PARTS = 9;
    uint8 private constant POOL_REWARD = 0;

    IERC20 public constant USDC = IERC20(0x3600000000000000000000000000000000000000);
    IERC20 public constant GARC = IERC20(0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc);

    uint256[TIER_COUNT] private _milestoneDays = [uint256(30), 90, 180, 365];
    uint256[TIER_COUNT] private _milestoneReleaseBps = [uint256(150), 1_000, 1_500, 1_800];
    uint8[TIER_COUNT] private _requiredVerifyLevel = [uint8(1), 2, 3, 4];

    uint256 public checkinFee;
    IGMPool public gmPool;
    IGMBuyback public gmBuyback;
    IGMSoulBound public soulBoundContract;

    bool public verificationEnabled;
    address public signer;
    mapping(address => uint8) public verifiedLevel;

    mapping(uint256 => uint256) public snapshotTotalClaimUsdc;
    mapping(uint256 => uint256) public snapshotReservedUsdc;
    mapping(uint256 => bool) public snapshotExecuted;
    mapping(address => mapping(uint8 => uint256)) public pendingClaimDay;
    mapping(address => mapping(uint8 => uint256)) public pendingClaimUsdc;
    mapping(address => mapping(uint8 => uint256)) public milestoneLastClaimedDay;

    uint256 public totalCheckins;
    uint256 public totalMilestoneClaims;
    uint256 public totalUsdcClaimed;
    uint256 public totalGArcDistributed;

    struct UserInfo {
        uint256 lastCheckinDay;
        uint256 currentStreak;
        uint256 totalCheckins;
    }

    mapping(address => UserInfo) private _users;

    error ZeroAddress();
    error InvalidFee(uint256 provided);
    error AlreadyCheckedInToday();
    error InvalidCheckinDay();
    error InvalidTier(uint8 provided);
    error MilestoneNotReached(uint8 tier, uint256 currentStreak, uint256 required);
    error MilestoneAlreadyQueued(uint8 tier, uint256 queuedDay);
    error MilestoneAlreadyClaimedForCurrentCycle(uint8 tier);
    error ZeroClaimAmount();
    error VerificationRequired(uint8 tier, uint8 requiredLevel, uint8 currentLevel);
    error InvalidSignature();
    error SignatureExpired(uint256 deadline);
    error SnapshotNotExecuted(uint256 dayIndex);
    error NoPendingClaim(uint8 tier);
    error SnapshotAlreadyExecuted(uint256 dayIndex);
    error NoClaimsToSnapshot(uint256 dayIndex);
    error InsufficientRewardPool(uint256 required, uint256 available);

    event CheckedIn(address indexed user, uint256 dayIndex, uint256 streak, uint256 fee);
    event MilestoneQueued(address indexed user, uint8 tier, uint256 dayIndex, uint256 claimUsdc);
    event SnapshotExecuted(uint256 indexed dayIndex, uint256 totalUsdc, uint256 timestamp);
    event MilestoneClaimed(address indexed user, uint8 tier, uint256 usdcAmount, uint256 gArcAmount, uint256 dayIndex);
    event VerificationCompleted(address indexed user, uint8 tier, uint8 newLevel);
    event CheckinFeeUpdated(uint256 oldFee, uint256 newFee);
    event GMPoolUpdated(address indexed newPool);
    event GMBuybackUpdated(address indexed newBuyback);
    event SoulBoundContractUpdated(address indexed soulBound);
    event SignerUpdated(address indexed newSigner);
    event VerificationEnabledUpdated(bool enabled);

    constructor(address initialOwner, address _gmPool, address _gmBuyback) Ownable(initialOwner) {
        _validateNonZero(_gmPool);
        _validateNonZero(_gmBuyback);

        gmPool = IGMPool(_gmPool);
        gmBuyback = IGMBuyback(_gmBuyback);

        checkinFee = 100_000;
        verificationEnabled = false;
        signer = initialOwner;
    }

    function checkin() external whenNotPaused nonReentrant {
        uint256 fee = checkinFee;
        if (fee == 0) revert InvalidFee(fee);

        uint256 dayIndex = _currentDayIndex();
        UserInfo storage user = _users[msg.sender];

        if (user.totalCheckins == 0) {
            user.currentStreak = 1;
        } else {
            if (dayIndex == user.lastCheckinDay) revert AlreadyCheckedInToday();
            if (dayIndex < user.lastCheckinDay) revert InvalidCheckinDay();

            if (dayIndex == user.lastCheckinDay + 1) {
                unchecked {
                    user.currentStreak += 1;
                }
            } else {
                user.currentStreak = 1;
            }
        }

        user.lastCheckinDay = dayIndex;

        unchecked {
            user.totalCheckins += 1;
            totalCheckins += 1;
        }

        USDC.safeTransferFrom(msg.sender, address(this), fee);
        USDC.forceApprove(address(gmPool), fee);
        gmPool.receiveCheckinFee(fee);

        emit CheckedIn(msg.sender, dayIndex, user.currentStreak, fee);
    }

    function queueMilestoneClaim(uint8 tier) external whenNotPaused nonReentrant {
        if (tier >= TIER_COUNT) revert InvalidTier(tier);

        UserInfo storage user = _users[msg.sender];
        uint256 streak = user.currentStreak;
        uint256 requiredDays = _milestoneDays[tier];
        if (streak < requiredDays) revert MilestoneNotReached(tier, streak, requiredDays);

        uint256 queuedDay = pendingClaimDay[msg.sender][tier];
        if (queuedDay != 0) revert MilestoneAlreadyQueued(tier, queuedDay);

        uint256 dayIndex = _currentDayIndex();
        if (dayIndex < user.lastCheckinDay) revert InvalidCheckinDay();

        uint256 streakStartDay = user.lastCheckinDay - streak + 1;
        uint256 currentCycle = streak / requiredDays;

        uint256 lastClaimedDay = milestoneLastClaimedDay[msg.sender][tier];
        uint256 claimedCycle;
        if (lastClaimedDay >= streakStartDay) {
            claimedCycle = (lastClaimedDay - streakStartDay + 1) / requiredDays;
        }

        if (claimedCycle >= currentCycle) {
            revert MilestoneAlreadyClaimedForCurrentCycle(tier);
        }

        if (verificationEnabled) {
            uint8 requiredLevel = _requiredVerifyLevel[tier];
            uint8 currentLevel = verifiedLevel[msg.sender];
            if (currentLevel < requiredLevel) {
                revert VerificationRequired(tier, requiredLevel, currentLevel);
            }
        }

        uint256 claimUsdc = (gmPool.poolBalance(POOL_REWARD) * _milestoneReleaseBps[tier]) / BPS_DENOMINATOR;
        if (claimUsdc == 0) revert ZeroClaimAmount();

        uint256 usdcToPull = (claimUsdc * BUYBACK_TOTAL_PARTS + (BUYBACK_USER_PARTS - 1)) / BUYBACK_USER_PARTS;

        uint256 poolBalance = gmPool.poolBalance(POOL_REWARD);
        uint256 reserved = snapshotReservedUsdc[dayIndex];
        uint256 available = poolBalance > reserved ? poolBalance - reserved : 0;
        if (usdcToPull > available) revert InsufficientRewardPool(usdcToPull, available);

        pendingClaimDay[msg.sender][tier] = dayIndex;
        pendingClaimUsdc[msg.sender][tier] = claimUsdc;

        unchecked {
            snapshotReservedUsdc[dayIndex] += usdcToPull;
            snapshotTotalClaimUsdc[dayIndex] += usdcToPull;
        }

        emit MilestoneQueued(msg.sender, tier, dayIndex, claimUsdc);
    }

    function executeSnapshot(uint256 dayIndex) external nonReentrant {
        if (snapshotExecuted[dayIndex]) revert SnapshotAlreadyExecuted(dayIndex);

        uint256 totalUsdc = snapshotTotalClaimUsdc[dayIndex];
        if (totalUsdc == 0) revert NoClaimsToSnapshot(dayIndex);
        if (dayIndex > _currentDayIndex()) revert InvalidCheckinDay();

        snapshotExecuted[dayIndex] = true;

        gmPool.withdrawReward(totalUsdc, address(this));

        try gmBuyback.executeBuyback() {} catch {}

        emit SnapshotExecuted(dayIndex, totalUsdc, block.timestamp);
    }

    function claimMilestone(uint8 tier) external whenNotPaused nonReentrant {
        if (tier >= TIER_COUNT) revert InvalidTier(tier);

        uint256 queuedDay = pendingClaimDay[msg.sender][tier];
        if (queuedDay == 0) revert NoPendingClaim(tier);
        if (!snapshotExecuted[queuedDay]) revert SnapshotNotExecuted(queuedDay);

        uint256 claimUsdc = pendingClaimUsdc[msg.sender][tier];
        if (claimUsdc == 0) revert ZeroClaimAmount();

        uint256 gArcAmount = claimUsdc;

        pendingClaimDay[msg.sender][tier] = 0;
        pendingClaimUsdc[msg.sender][tier] = 0;
        milestoneLastClaimedDay[msg.sender][tier] = queuedDay;

        unchecked {
            totalMilestoneClaims += 1;
            totalUsdcClaimed += claimUsdc;
            totalGArcDistributed += gArcAmount;
        }

        gmPool.withdrawGArc(gArcAmount, msg.sender);

        emit MilestoneClaimed(msg.sender, tier, claimUsdc, gArcAmount, queuedDay);

        if (address(soulBoundContract) != address(0)) {
            try soulBoundContract.mint(msg.sender, tier, "") {} catch {}
        }
    }

    function completeVerification(uint8 tier, uint256 deadline, bytes calldata signature) external {
        if (tier >= TIER_COUNT) revert InvalidTier(tier);
        if (block.timestamp > deadline) revert SignatureExpired(deadline);

        bytes32 messageHash = keccak256(abi.encodePacked(address(this), msg.sender, tier, deadline, block.chainid));
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recovered = ECDSA.recover(digest, signature);

        if (recovered != signer) revert InvalidSignature();

        uint8 requiredLevel = _requiredVerifyLevel[tier];
        uint8 updatedLevel = verifiedLevel[msg.sender];
        if (updatedLevel < requiredLevel) {
            updatedLevel = requiredLevel;
            verifiedLevel[msg.sender] = updatedLevel;
        }

        emit VerificationCompleted(msg.sender, tier, updatedLevel);
    }

    function getUserInfo(address user)
        external
        view
        returns (uint256 lastCheckinDay, uint256 currentStreak, uint256 totalUserCheckins)
    {
        UserInfo storage info = _users[user];
        return (info.lastCheckinDay, info.currentStreak, info.totalCheckins);
    }

    function getMilestoneStatus(
        address user,
        uint8 tier
    )
        external
        view
        returns (
            bool reached,
            bool queued,
            bool snapshotReady,
            uint256 pendingUsdc,
            uint256 requiredDays,
            uint256 currentStreak
        )
    {
        if (tier >= TIER_COUNT) revert InvalidTier(tier);

        UserInfo storage info = _users[user];
        requiredDays = _milestoneDays[tier];
        currentStreak = info.currentStreak;
        reached = currentStreak >= requiredDays;

        uint256 queuedDay = pendingClaimDay[user][tier];
        queued = queuedDay != 0;
        snapshotReady = queued && snapshotExecuted[queuedDay];
        pendingUsdc = pendingClaimUsdc[user][tier];
    }

    function canClaimMilestone(address user, uint8 tier) external view returns (bool) {
        if (tier >= TIER_COUNT) revert InvalidTier(tier);

        uint256 queuedDay = pendingClaimDay[user][tier];
        if (queuedDay == 0) return false;

        return snapshotExecuted[queuedDay] && pendingClaimUsdc[user][tier] > 0;
    }

    function getMilestoneConfig(uint8 tier) external view returns (uint256 requiredDays, uint256 releaseBps, uint8 requiredVerifyLevel) {
        if (tier >= TIER_COUNT) revert InvalidTier(tier);
        return (_milestoneDays[tier], _milestoneReleaseBps[tier], _requiredVerifyLevel[tier]);
    }

    function currentDayIndex() external view returns (uint256) {
        return _currentDayIndex();
    }

    function setCheckinFee(uint256 newFee) external onlyOwner {
        if (newFee == 0) revert InvalidFee(newFee);

        uint256 oldFee = checkinFee;
        checkinFee = newFee;

        emit CheckinFeeUpdated(oldFee, newFee);
    }

    function setGMPool(address _gmPool) external onlyOwner {
        _validateNonZero(_gmPool);
        gmPool = IGMPool(_gmPool);
        emit GMPoolUpdated(_gmPool);
    }

    function setGMBuyback(address _gmBuyback) external onlyOwner {
        _validateNonZero(_gmBuyback);
        gmBuyback = IGMBuyback(_gmBuyback);
        emit GMBuybackUpdated(_gmBuyback);
    }

    function setSoulBoundContract(address _soulBound) external onlyOwner {
        soulBoundContract = IGMSoulBound(_soulBound);
        emit SoulBoundContractUpdated(_soulBound);
    }

    function setSigner(address _signer) external onlyOwner {
        _validateNonZero(_signer);
        signer = _signer;
        emit SignerUpdated(_signer);
    }

    function setVerificationEnabled(bool enabled) external onlyOwner {
        verificationEnabled = enabled;
        emit VerificationEnabledUpdated(enabled);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _currentDayIndex() internal view returns (uint256) {
        return block.timestamp / DAY_SECONDS;
    }

    function _validateNonZero(address account) internal pure {
        if (account == address(0)) revert ZeroAddress();
    }
}
