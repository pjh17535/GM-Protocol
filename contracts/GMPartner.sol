// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IGMCheckIn {
    function partnerCheckin(address user) external;
    function checkinFee() external view returns (uint256);
}

interface IGMBuyback {
    function executeBuyback() external;
}

interface IGMMainPool {
    function injectFunds(uint256 amount) external;
}

contract GMPartner is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public constant USDC = IERC20(0x3600000000000000000000000000000000000000);
    uint256 public constant CHECKIN_FEE = 100_000; // 0.1 USDC, 6 decimals
    uint256 public constant MIN_INJECTION_TESTNET = 10e6; // 10 USDC testnet
    uint256 public constant MIN_INJECTION_MAINNET = 2_000e6; // 2000 USDC mainnet
    uint256 public constant ACTIVATION_WINDOW = 7 days;

    uint256 public constant PARTNER_REWARD_BPS = 8_000; // 80% user rewards
    uint256 public constant MAIN_GM_BPS = 1_000; // 10% -> main GM pool
    uint256 public constant BUYBACK_BPS = 1_000; // 10% -> buyback-burn
    uint256 public constant BPS_DENOMINATOR = 10_000;

    uint256 private constant DAY_SECONDS = 86_400;
    uint256 private constant BUYBACK_USER_PARTS = 8;
    uint256 private constant BUYBACK_TOTAL_PARTS = 9;

    // Identity
    string public projectName;
    string public projectWebsite;
    string public projectLogoURI;
    address public operator;

    // Protocol integration
    IGMCheckIn public gmCheckin;
    IGMBuyback public gmBuyback;
    IGMMainPool public gmMainPool;

    // Activation
    bool public isTestnet;
    uint256 public activationDeadline;
    bool public isActive;
    uint256 public totalInjected;

    // Pool accounting
    uint256 public rewardPoolBalance;
    uint256 public totalRewardClaimed;

    // Milestone config
    uint8 public milestoneCount;
    uint256[4] public milestoneDays;
    uint256[4] public milestoneReleaseBps;

    // User tracking
    struct PartnerUserInfo {
        uint256 lastCheckinDay;
        uint256 currentStreak;
        uint256 totalCheckins;
    }

    mapping(address => PartnerUserInfo) private _users;

    // Milestone tracking
    mapping(address => mapping(uint8 => uint256)) public pendingClaimDay;
    mapping(address => mapping(uint8 => uint256)) public pendingClaimUsdc;
    mapping(address => mapping(uint8 => uint256)) public milestoneLastClaimedDay;
    mapping(uint256 => bool) public snapshotExecuted;
    mapping(uint256 => uint256) public snapshotTotalClaimUsdc;
    mapping(uint256 => uint256) public snapshotReservedUsdc;

    // Stats
    uint256 public totalCheckins;
    uint256 public totalClaims;

    error NotOperator();
    error NotOwner();
    error AlreadyCheckedInToday();
    error ContractNotActive();
    error ActivationWindowExpired();
    error AlreadyActive();
    error InsufficientInjection(uint256 required, uint256 provided);
    error InvalidMilestoneCount(uint8 provided);
    error InvalidMilestoneDays();
    error MilestoneNotReached(uint8 tier, uint256 streak, uint256 required);
    error MilestoneAlreadyQueued(uint8 tier);
    error MilestoneAlreadyClaimedThisCycle(uint8 tier);
    error InsufficientRewardPool(uint256 required, uint256 available);
    error ZeroClaimAmount();
    error NoPendingClaim(uint8 tier);
    error SnapshotNotExecuted(uint256 dayIndex);
    error SnapshotAlreadyExecuted(uint256 dayIndex);
    error NoClaimsToSnapshot(uint256 dayIndex);

    event PartnerCheckedIn(address indexed user, uint256 dayIndex, uint256 streak);
    event FundsInjected(
        address indexed from,
        uint256 amount,
        uint256 rewardShare,
        uint256 mainGMShare,
        uint256 buybackShare
    );
    event ContractActivated(uint256 totalInjected, uint256 timestamp);
    event MilestoneQueued(address indexed user, uint8 tier, uint256 dayIndex, uint256 claimUsdc);
    event SnapshotExecuted(uint256 indexed dayIndex, uint256 totalUsdc, uint256 timestamp);
    event MilestoneClaimed(address indexed user, uint8 tier, uint256 usdcAmount, uint256 dayIndex);
    event OperatorUpdated(address indexed newOperator);
    event LogoURIUpdated(string newURI);

    modifier onlyOwnerCustom() {
        if (msg.sender != owner()) revert NotOwner();
        _;
    }

    modifier onlyOperatorOrOwner() {
        if (msg.sender != operator && msg.sender != owner()) revert NotOperator();
        _;
    }

    constructor(
        address _owner,
        address _operator,
        address _gmCheckin,
        address _gmBuyback,
        address _gmMainPool,
        string memory _projectName,
        string memory _projectWebsite,
        uint8 _milestoneCount,
        uint256[4] memory _milestoneDays,
        bool _isTestnet
    ) Ownable(_owner) {
        if (_milestoneCount == 0 || _milestoneCount > 4) revert InvalidMilestoneCount(_milestoneCount);

        uint256 previous;
        for (uint8 i = 0; i < _milestoneCount; i++) {
            uint256 dayValue = _milestoneDays[i];
            if (dayValue < 7 || dayValue > 365) revert InvalidMilestoneDays();
            if (i > 0 && dayValue <= previous) revert InvalidMilestoneDays();
            milestoneDays[i] = dayValue;
            previous = dayValue;
        }

        operator = _operator;
        gmCheckin = IGMCheckIn(_gmCheckin);
        gmBuyback = IGMBuyback(_gmBuyback);
        gmMainPool = IGMMainPool(_gmMainPool);

        projectName = _projectName;
        projectWebsite = _projectWebsite;
        projectLogoURI = "";

        milestoneCount = _milestoneCount;
        milestoneReleaseBps = [uint256(150), 1_000, 1_500, 1_800];

        isTestnet = _isTestnet;
        activationDeadline = block.timestamp + ACTIVATION_WINDOW;
        isActive = false;
    }

    function injectFunds(uint256 amount) external nonReentrant {
        bool wasActive = isActive;
        uint256 minInjection = getMinInjection();

        if (!wasActive) {
            if (block.timestamp > activationDeadline) revert ActivationWindowExpired();
            uint256 projected = totalInjected + amount;
            if (projected < minInjection) {
                revert InsufficientInjection(minInjection, projected);
            }
        }

        USDC.safeTransferFrom(msg.sender, address(this), amount);

        (uint256 rewardShare, uint256 mainGMShare, uint256 buybackShare) = _splitAmount(amount);

        rewardPoolBalance += rewardShare;
        totalInjected += amount;

        if (mainGMShare > 0) {
            USDC.forceApprove(address(gmMainPool), mainGMShare);
            gmMainPool.injectFunds(mainGMShare);
            USDC.forceApprove(address(gmMainPool), 0);
        }

        if (!wasActive && totalInjected >= minInjection) {
            isActive = true;
            emit ContractActivated(totalInjected, block.timestamp);
        }

        emit FundsInjected(msg.sender, amount, rewardShare, mainGMShare, buybackShare);
    }

    function checkin() external nonReentrant {
        if (!isActive) revert ContractNotActive();

        uint256 dayIndex = _currentDayIndex();
        PartnerUserInfo storage user = _users[msg.sender];

        if (user.lastCheckinDay == dayIndex) revert AlreadyCheckedInToday();

        if (user.totalCheckins == 0) {
            user.currentStreak = 1;
        } else if (dayIndex == user.lastCheckinDay + 1) {
            user.currentStreak += 1;
        } else {
            user.currentStreak = 1;
        }

        user.lastCheckinDay = dayIndex;
        user.totalCheckins += 1;
        totalCheckins += 1;

        uint256 fee = CHECKIN_FEE;
        USDC.safeTransferFrom(msg.sender, address(this), fee);

        gmCheckin.partnerCheckin(msg.sender);

        (uint256 rewardShare, uint256 mainGMShare, uint256 buybackShare) = _splitAmount(fee);

        rewardPoolBalance += rewardShare;

        if (mainGMShare > 0) {
            USDC.forceApprove(address(gmMainPool), mainGMShare);
            gmMainPool.injectFunds(mainGMShare);
            USDC.forceApprove(address(gmMainPool), 0);
        }

        emit PartnerCheckedIn(msg.sender, dayIndex, user.currentStreak);
        emit FundsInjected(msg.sender, fee, rewardShare, mainGMShare, buybackShare);
    }

    function queueMilestoneClaim(uint8 tier) external nonReentrant {
        if (!isActive) revert ContractNotActive();
        if (tier >= milestoneCount) revert InvalidMilestoneCount(tier);

        PartnerUserInfo storage user = _users[msg.sender];
        uint256 streak = user.currentStreak;
        uint256 requiredDays = milestoneDays[tier];

        if (streak < requiredDays) revert MilestoneNotReached(tier, streak, requiredDays);

        if (pendingClaimDay[msg.sender][tier] != 0) revert MilestoneAlreadyQueued(tier);

        uint256 dayIndex = _currentDayIndex();
        uint256 streakStartDay = user.lastCheckinDay - streak + 1;
        uint256 currentCycle = streak / requiredDays;

        uint256 lastClaimedDay = milestoneLastClaimedDay[msg.sender][tier];
        uint256 claimedCycle;

        if (lastClaimedDay >= streakStartDay) {
            claimedCycle = (lastClaimedDay - streakStartDay + 1) / requiredDays;
        }

        if (claimedCycle >= currentCycle) {
            revert MilestoneAlreadyClaimedThisCycle(tier);
        }

        uint256 claimUsdc = (rewardPoolBalance * milestoneReleaseBps[tier]) / BPS_DENOMINATOR;
        if (claimUsdc == 0) revert ZeroClaimAmount();

        uint256 usdcToPull = ((claimUsdc * BUYBACK_TOTAL_PARTS) + (BUYBACK_USER_PARTS - 1)) / BUYBACK_USER_PARTS;

        uint256 reserved = snapshotReservedUsdc[dayIndex];
        uint256 available = rewardPoolBalance > reserved ? rewardPoolBalance - reserved : 0;
        if (usdcToPull > available) revert InsufficientRewardPool(usdcToPull, available);

        pendingClaimDay[msg.sender][tier] = dayIndex;
        pendingClaimUsdc[msg.sender][tier] = claimUsdc;
        snapshotTotalClaimUsdc[dayIndex] += usdcToPull;
        snapshotReservedUsdc[dayIndex] += usdcToPull;

        emit MilestoneQueued(msg.sender, tier, dayIndex, claimUsdc);
    }

    function executeSnapshot(uint256 dayIndex) external nonReentrant {
        uint256 totalUsdc = snapshotTotalClaimUsdc[dayIndex];
        if (totalUsdc == 0) revert NoClaimsToSnapshot(dayIndex);
        if (snapshotExecuted[dayIndex]) revert SnapshotAlreadyExecuted(dayIndex);
        if (dayIndex > _currentDayIndex()) revert SnapshotNotExecuted(dayIndex);

        snapshotExecuted[dayIndex] = true;

        try gmBuyback.executeBuyback() {} catch {}

        emit SnapshotExecuted(dayIndex, totalUsdc, block.timestamp);
    }

    function claimMilestone(uint8 tier) external nonReentrant {
        if (!isActive) revert ContractNotActive();
        if (tier >= milestoneCount) revert InvalidMilestoneCount(tier);

        uint256 queuedDay = pendingClaimDay[msg.sender][tier];
        if (queuedDay == 0) revert NoPendingClaim(tier);
        if (!snapshotExecuted[queuedDay]) revert SnapshotNotExecuted(queuedDay);

        uint256 claimUsdc = pendingClaimUsdc[msg.sender][tier];
        if (claimUsdc == 0) revert ZeroClaimAmount();

        pendingClaimDay[msg.sender][tier] = 0;
        pendingClaimUsdc[msg.sender][tier] = 0;

        if (claimUsdc > rewardPoolBalance) revert InsufficientRewardPool(claimUsdc, rewardPoolBalance);

        rewardPoolBalance -= claimUsdc;
        totalRewardClaimed += claimUsdc;
        milestoneLastClaimedDay[msg.sender][tier] = queuedDay;

        USDC.safeTransfer(msg.sender, claimUsdc);

        totalClaims += 1;

        emit MilestoneClaimed(msg.sender, tier, claimUsdc, queuedDay);
    }

    function setOperator(address newOperator) external onlyOwnerCustom {
        operator = newOperator;
        emit OperatorUpdated(newOperator);
    }

    function setLogoURI(string calldata uri) external onlyOperatorOrOwner {
        projectLogoURI = uri;
        emit LogoURIUpdated(uri);
    }

    function expireContract() external onlyOwnerCustom {
        if (isActive) revert AlreadyActive();
        if (block.timestamp <= activationDeadline) revert ActivationWindowExpired();
        activationDeadline = 0;
    }

    function getUserInfo(
        address user
    ) external view returns (uint256 lastCheckinDay, uint256 currentStreak, uint256 totalUserCheckins) {
        PartnerUserInfo storage info = _users[user];
        return (info.lastCheckinDay, info.currentStreak, info.totalCheckins);
    }

    function getMilestoneStatus(
        address user,
        uint8 tier
    ) external view returns (bool reached, bool queued, bool snapshotReady, uint256 pendingUsdc) {
        if (tier >= milestoneCount) revert InvalidMilestoneCount(tier);

        uint256 requiredDays = milestoneDays[tier];
        uint256 streak = _users[user].currentStreak;
        reached = streak >= requiredDays;

        uint256 queuedDay = pendingClaimDay[user][tier];
        queued = queuedDay != 0;
        snapshotReady = queued && snapshotExecuted[queuedDay];
        pendingUsdc = pendingClaimUsdc[user][tier];
    }

    function getMinInjection() public view returns (uint256) {
        return isTestnet ? MIN_INJECTION_TESTNET : MIN_INJECTION_MAINNET;
    }

    function isExpired() external view returns (bool) {
        return !isActive && block.timestamp > activationDeadline;
    }

    function _splitAmount(uint256 amount) internal pure returns (uint256 rewardShare, uint256 mainGMShare, uint256 buybackShare) {
        rewardShare = (amount * PARTNER_REWARD_BPS) / BPS_DENOMINATOR;
        mainGMShare = (amount * MAIN_GM_BPS) / BPS_DENOMINATOR;
        buybackShare = (amount * BUYBACK_BPS) / BPS_DENOMINATOR;

        uint256 dust = amount - rewardShare - mainGMShare - buybackShare;
        rewardShare += dust;
    }

    function _currentDayIndex() internal view returns (uint256) {
        return block.timestamp / DAY_SECONDS;
    }
}
