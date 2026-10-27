// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract GMPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public constant USDC = IERC20(0x3600000000000000000000000000000000000000);
    IERC20 private constant GARC = IERC20(0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc);

    uint8 public constant POOL_REWARD = 0;
    uint8 public constant POOL_RESERVE = 1;
    uint8 public constant POOL_PROTOCOL = 2;
    uint8 public constant POOL_PARTNER = 3;

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant REWARD_BPS = 8_000;
    uint256 public constant RESERVE_BPS = 1_000;
    uint256 public constant PROTOCOL_BPS = 500;
    uint256 public constant PARTNER_BPS = 500;

    mapping(uint8 => uint256) public poolBalance;
    mapping(uint8 => uint256) public totalDeposited;
    mapping(uint8 => uint256) public totalWithdrawn;

    address public checkinContract;
    address public buybackContract;

    uint256 public totalCheckins;
    uint256 public lastQuarterlyInjection;
    uint256 public quarterlyInjectionCount;
    uint256 public gTotal;
    bool public gTotalSet;
    uint256 public gArcClaimBalance;
    uint256 public totalGArcDistributed;

    error ZeroAddress();
    error Unauthorized();
    error InvalidAmount();
    error InsufficientPoolBalance(uint8 poolId, uint256 available, uint256 requested);
    error QuarterlyInjectionLimitReached();
    error QuarterlyAmountOutOfRange(uint256 expected, uint256 provided, uint256 minAllowed, uint256 maxAllowed);
    error GTotalAlreadySet();
    error GTotalNotSet();
    error CannotRescueUSDC();
    error QuarterlyInjectionTooSoon(uint256 nextAllowed);
    error GTotalMustBePositive();

    event CheckinFeeReceived(
        uint256 amount,
        uint256 rewardShare,
        uint256 reserveShare,
        uint256 protocolShare,
        uint256 partnerShare
    );
    event ReserveWithdrawn(address indexed caller, uint256 amount);
    event RewardWithdrawn(address indexed to, uint256 amount);
    event ProtocolWithdrawn(address indexed to, uint256 amount);
    event PartnerWithdrawn(address indexed to, uint256 amount);
    event FundsInjected(
        address indexed from,
        uint256 amount,
        uint256 rewardShare,
        uint256 reserveShare,
        uint256 protocolShare,
        uint256 partnerShare
    );
    event QuarterlyInjectionExecuted(uint256 indexed quarter, uint256 amount, uint256 expectedAmount, uint256 timestamp);
    event GTotalSet(uint256 gTotal);
    event CheckinContractUpdated(address indexed newContract);
    event BuybackContractUpdated(address indexed newContract);
    event GARCDeposited(address indexed from, uint256 amount);
    event GARCWithdrawn(address indexed to, uint256 amount);
    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);

    constructor(address initialOwner, uint256 _gTotal) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();

        if (_gTotal != 0) {
            if (_gTotal == 0) revert GTotalMustBePositive();
            gTotal = _gTotal;
            gTotalSet = true;
        }
    }

    function receiveCheckinFee(uint256 amount) external nonReentrant {
        if (msg.sender != checkinContract) revert Unauthorized();
        if (amount == 0) revert InvalidAmount();

        USDC.safeTransferFrom(msg.sender, address(this), amount);

        (uint256 rewardShare, uint256 reserveShare, uint256 protocolShare, uint256 partnerShare) = _splitAmount(amount);
        _creditPools(rewardShare, reserveShare, protocolShare, partnerShare);

        unchecked {
            totalCheckins += 1;
        }

        emit CheckinFeeReceived(amount, rewardShare, reserveShare, protocolShare, partnerShare);
    }

    function withdrawReserve(uint256 amount) external nonReentrant {
        if (msg.sender != buybackContract) revert Unauthorized();

        _withdrawFromPool(POOL_RESERVE, amount, buybackContract);

        emit ReserveWithdrawn(msg.sender, amount);
    }

    function withdrawReward(uint256 amount, address to) external nonReentrant {
        if (msg.sender != checkinContract) revert Unauthorized();
        if (to == address(0)) revert ZeroAddress();

        _withdrawFromPool(POOL_REWARD, amount, to);

        emit RewardWithdrawn(to, amount);
    }

    function withdrawProtocol(uint256 amount, address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();

        _withdrawFromPool(POOL_PROTOCOL, amount, to);

        emit ProtocolWithdrawn(to, amount);
    }

    function withdrawPartner(uint256 amount, address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();

        _withdrawFromPool(POOL_PARTNER, amount, to);

        emit PartnerWithdrawn(to, amount);
    }

    function depositGArc(uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidAmount();

        GARC.safeTransferFrom(msg.sender, address(this), amount);

        unchecked {
            gArcClaimBalance += amount;
        }

        emit GARCDeposited(msg.sender, amount);
    }

    function withdrawGArc(uint256 amount, address to) external nonReentrant {
        if (msg.sender != checkinContract) revert Unauthorized();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();

        uint256 currentBalance = gArcClaimBalance;
        if (currentBalance < amount) {
            revert InsufficientPoolBalance(POOL_REWARD, currentBalance, amount);
        }

        unchecked {
            gArcClaimBalance = currentBalance - amount;
            totalGArcDistributed += amount;
        }

        GARC.safeTransfer(to, amount);

        emit GARCWithdrawn(to, amount);
    }

    function injectFunds(uint256 amount) external nonReentrant {
        _injectFunds(msg.sender, amount);
    }

    function executeQuarterlyInjection(uint256 amount) external onlyOwner nonReentrant {
        if (quarterlyInjectionCount >= 24) revert QuarterlyInjectionLimitReached();
        if (!gTotalSet) revert GTotalNotSet();
        if (gTotal == 0) revert GTotalMustBePositive();

        if (quarterlyInjectionCount > 0) {
            uint256 nextAllowed = lastQuarterlyInjection + 90 days;
            if (block.timestamp < nextAllowed) revert QuarterlyInjectionTooSoon(nextAllowed);
        }

        uint256 quarter = quarterlyInjectionCount + 1;
        uint256 expectedAmount = (gTotal * (49 - (2 * quarter))) / 576;

        uint256 minAllowed = (expectedAmount * 95) / 100;
        uint256 maxAllowed = (expectedAmount * 105) / 100;

        if (amount < minAllowed || amount > maxAllowed) {
            revert QuarterlyAmountOutOfRange(expectedAmount, amount, minAllowed, maxAllowed);
        }

        _injectFunds(msg.sender, amount);

        quarterlyInjectionCount = quarter;
        lastQuarterlyInjection = block.timestamp;

        emit QuarterlyInjectionExecuted(quarter, amount, expectedAmount, block.timestamp);
    }

    function setGTotal(uint256 _gTotal) external onlyOwner {
        if (gTotalSet) revert GTotalAlreadySet();
        if (_gTotal == 0) revert GTotalMustBePositive();

        gTotal = _gTotal;
        gTotalSet = true;

        emit GTotalSet(_gTotal);
    }

    function getPoolStatus()
        external
        view
        returns (uint256[4] memory balances, uint256[4] memory deposited, uint256[4] memory withdrawn)
    {
        balances[POOL_REWARD] = poolBalance[POOL_REWARD];
        balances[POOL_RESERVE] = poolBalance[POOL_RESERVE];
        balances[POOL_PROTOCOL] = poolBalance[POOL_PROTOCOL];
        balances[POOL_PARTNER] = poolBalance[POOL_PARTNER];

        deposited[POOL_REWARD] = totalDeposited[POOL_REWARD];
        deposited[POOL_RESERVE] = totalDeposited[POOL_RESERVE];
        deposited[POOL_PROTOCOL] = totalDeposited[POOL_PROTOCOL];
        deposited[POOL_PARTNER] = totalDeposited[POOL_PARTNER];

        withdrawn[POOL_REWARD] = totalWithdrawn[POOL_REWARD];
        withdrawn[POOL_RESERVE] = totalWithdrawn[POOL_RESERVE];
        withdrawn[POOL_PROTOCOL] = totalWithdrawn[POOL_PROTOCOL];
        withdrawn[POOL_PARTNER] = totalWithdrawn[POOL_PARTNER];
    }

    function getNextQuarterlyAmount() external view returns (uint256 quarter, uint256 expectedAmount) {
        if (!gTotalSet || quarterlyInjectionCount >= 24) {
            return (0, 0);
        }

        quarter = quarterlyInjectionCount + 1;
        expectedAmount = (gTotal * (49 - (2 * quarter))) / 576;
    }

    function setCheckinContract(address newCheckinContract) external onlyOwner {
        if (newCheckinContract == address(0)) revert ZeroAddress();

        checkinContract = newCheckinContract;

        emit CheckinContractUpdated(newCheckinContract);
    }

    function setBuybackContract(address newBuybackContract) external onlyOwner {
        if (newBuybackContract == address(0)) revert ZeroAddress();

        buybackContract = newBuybackContract;

        emit BuybackContractUpdated(newBuybackContract);
    }

    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        if (token == address(USDC)) revert CannotRescueUSDC();
        if (token == address(GARC)) revert CannotRescueUSDC();
        if (token == address(0) || to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();

        IERC20(token).safeTransfer(to, amount);

        emit EmergencyWithdraw(token, to, amount);
    }

    function _injectFunds(address from, uint256 amount) internal {
        if (amount == 0) revert InvalidAmount();

        USDC.safeTransferFrom(from, address(this), amount);

        (uint256 rewardShare, uint256 reserveShare, uint256 protocolShare, uint256 partnerShare) = _splitAmount(amount);
        _creditPools(rewardShare, reserveShare, protocolShare, partnerShare);

        emit FundsInjected(from, amount, rewardShare, reserveShare, protocolShare, partnerShare);
    }

    function _withdrawFromPool(uint8 poolId, uint256 amount, address to) internal {
        if (amount == 0) revert InvalidAmount();

        uint256 currentBalance = poolBalance[poolId];
        if (currentBalance < amount) {
            revert InsufficientPoolBalance(poolId, currentBalance, amount);
        }

        unchecked {
            poolBalance[poolId] = currentBalance - amount;
            totalWithdrawn[poolId] += amount;
        }

        USDC.safeTransfer(to, amount);
    }

    function _splitAmount(uint256 amount)
        internal
        pure
        returns (uint256 rewardShare, uint256 reserveShare, uint256 protocolShare, uint256 partnerShare)
    {
        rewardShare = (amount * REWARD_BPS) / BPS_DENOMINATOR;
        reserveShare = (amount * RESERVE_BPS) / BPS_DENOMINATOR;
        protocolShare = (amount * PROTOCOL_BPS) / BPS_DENOMINATOR;
        partnerShare = (amount * PARTNER_BPS) / BPS_DENOMINATOR;

        uint256 dust = amount - rewardShare - reserveShare - protocolShare - partnerShare;
        rewardShare += dust;
    }

    function _creditPools(
        uint256 rewardShare,
        uint256 reserveShare,
        uint256 protocolShare,
        uint256 partnerShare
    ) internal {
        unchecked {
            poolBalance[POOL_REWARD] += rewardShare;
            poolBalance[POOL_RESERVE] += reserveShare;
            poolBalance[POOL_PROTOCOL] += protocolShare;
            poolBalance[POOL_PARTNER] += partnerShare;

            totalDeposited[POOL_REWARD] += rewardShare;
            totalDeposited[POOL_RESERVE] += reserveShare;
            totalDeposited[POOL_PROTOCOL] += protocolShare;
            totalDeposited[POOL_PARTNER] += partnerShare;
        }
    }
}
