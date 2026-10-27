// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory);

    function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory);
}

interface IGARCBurn {
    function burn(uint256 amount) external;
}

contract GMBuyback is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public constant USDC = IERC20(0x3600000000000000000000000000000000000000);
    IERC20 public constant GARC = IERC20(0x742f1c4D413d13913c80D9b6A35002C2b7D8b9Fc);
    IUniswapV2Router public constant UNISWAP_V2_ROUTER = IUniswapV2Router(0xE27d5D256B370604F1Ff060fB489c6A8E3F8A6D9);

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant SLIPPAGE_NUMERATOR = 995;
    uint256 public constant SLIPPAGE_DENOMINATOR = 1000;

    address public reserveVault;
    uint256 public minBuybackAmount;
    uint256 public cooldownPeriod;
    uint256 public lastBuybackTime;
    uint256 public totalUsdcUsed;
    uint256 public totalGarcBurned;
    uint256 public triggerCount;
    uint256 public maxSingleBuyback;

    uint256 public baseIncentiveBps;
    uint256 public maxIncentiveBps;

    error CooldownActive(uint256 currentTime, uint256 nextAllowedTime);
    error BuybackAmountTooLow(uint256 amount, uint256 minimum);
    error InvalidCooldownPeriod();
    error InvalidMaxSingleBuyback();
    error InvalidIncentiveParams(uint256 baseBps, uint256 maxBps);
    error IncentiveParamsTooHigh();
    error InvalidReserveVault();
    error InvalidSwapQuote();
    error ZeroSwapAmount();
    error ZeroBurnAmount();

    event BuybackExecuted(
        address indexed caller,
        uint256 usdcIn,
        uint256 callerIncentive,
        uint256 swapAmount,
        uint256 garcBurned,
        uint256 timestamp
    );
    event ReserveVaultUpdated(address indexed newVault);
    event CooldownUpdated(uint256 newCooldown);
    event IncentiveParamsUpdated(uint256 baseBps, uint256 maxBps);

    constructor(address initialOwner, address _reserveVault) Ownable(initialOwner) {
        reserveVault = _reserveVault;

        minBuybackAmount = 1e6; // 1 USDC (6 decimals)
        cooldownPeriod = 1800; // 30 minutes
        maxSingleBuyback = 10e6; // 10 USDC (6 decimals)

        baseIncentiveBps = 10; // 0.1%
        maxIncentiveBps = 100; // 1%
    }

    function executeBuyback() external nonReentrant whenNotPaused {
        if (reserveVault == address(0)) revert InvalidReserveVault();

        uint256 nextAllowedTime = lastBuybackTime + cooldownPeriod;
        if (block.timestamp < nextAllowedTime) {
            revert CooldownActive(block.timestamp, nextAllowedTime);
        }

        uint256 reserveBalance = USDC.balanceOf(reserveVault);
        uint256 buybackAmount = reserveBalance < maxSingleBuyback ? reserveBalance : maxSingleBuyback;

        if (buybackAmount < minBuybackAmount) {
            revert BuybackAmountTooLow(buybackAmount, minBuybackAmount);
        }

        uint256 callerIncentive;
        if (msg.sender != owner()) {
            uint256 incentiveBps = _getCurrentIncentiveBps();
            callerIncentive = (buybackAmount * incentiveBps) / BPS_DENOMINATOR;
        }

        USDC.safeTransferFrom(reserveVault, address(this), buybackAmount);

        if (callerIncentive > 0) {
            USDC.safeTransfer(msg.sender, callerIncentive);
        }

        uint256 swapAmount = buybackAmount - callerIncentive;
        if (swapAmount == 0) revert ZeroSwapAmount();

        // Randomized swap sizing was considered for MEV resistance; per specification, full swapAmount is used to maximize burn.
        address[] memory path = new address[](2);
        path[0] = address(USDC);
        path[1] = address(GARC);

        uint256[] memory quote = UNISWAP_V2_ROUTER.getAmountsOut(swapAmount, path);
        uint256 expectedOut = quote[quote.length - 1];
        /// @dev Testnet: 0.5% slippage accepted. Mainnet: replace with TWAP-based amountOutMin or private orderflow to prevent sandwich attacks.
        uint256 amountOutMin = (expectedOut * SLIPPAGE_NUMERATOR) / SLIPPAGE_DENOMINATOR;

        if (amountOutMin == 0) revert InvalidSwapQuote();

        USDC.forceApprove(address(UNISWAP_V2_ROUTER), swapAmount);

        uint256 garcBefore = GARC.balanceOf(address(this));
        UNISWAP_V2_ROUTER.swapExactTokensForTokens(
            swapAmount,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 300
        );

        uint256 garcReceived = GARC.balanceOf(address(this)) - garcBefore;
        if (garcReceived == 0) revert ZeroBurnAmount();

        IGARCBurn(address(GARC)).burn(garcReceived);

        lastBuybackTime = block.timestamp;
        totalUsdcUsed += buybackAmount;
        totalGarcBurned += garcReceived;
        triggerCount += 1;

        emit BuybackExecuted(msg.sender, buybackAmount, callerIncentive, swapAmount, garcReceived, block.timestamp);
    }

    function setReserveVault(address newVault) external onlyOwner {
        reserveVault = newVault;
        emit ReserveVaultUpdated(newVault);
    }

    function setMinBuybackAmount(uint256 newMinBuybackAmount) external onlyOwner {
        minBuybackAmount = newMinBuybackAmount;
    }

    function setCooldownPeriod(uint256 newCooldownPeriod) external onlyOwner {
        if (newCooldownPeriod == 0) revert InvalidCooldownPeriod();
        cooldownPeriod = newCooldownPeriod;
        emit CooldownUpdated(newCooldownPeriod);
    }

    function setMaxSingleBuyback(uint256 newMaxSingleBuyback) external onlyOwner {
        if (newMaxSingleBuyback == 0) revert InvalidMaxSingleBuyback();
        maxSingleBuyback = newMaxSingleBuyback;
    }

    function setIncentiveParams(uint256 baseBps, uint256 maxBps) external onlyOwner {
        if (baseBps > 10 || maxBps > 100) {
            revert IncentiveParamsTooHigh();
        }

        if (baseBps > maxBps || maxBps > BPS_DENOMINATOR) {
            revert InvalidIncentiveParams(baseBps, maxBps);
        }

        baseIncentiveBps = baseBps;
        maxIncentiveBps = maxBps;

        emit IncentiveParamsUpdated(baseBps, maxBps);
    }

    function getCurrentIncentiveBps() external view returns (uint256) {
        return _getCurrentIncentiveBps();
    }

    function canExecute() external view returns (bool) {
        if (reserveVault == address(0)) return false;
        if (block.timestamp < lastBuybackTime + cooldownPeriod) return false;

        uint256 reserveBalance = USDC.balanceOf(reserveVault);
        uint256 buybackAmount = reserveBalance < maxSingleBuyback ? reserveBalance : maxSingleBuyback;
        return buybackAmount >= minBuybackAmount;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _getCurrentIncentiveBps() internal view returns (uint256) {
        if (cooldownPeriod == 0) return maxIncentiveBps;

        uint256 elapsed = block.timestamp - lastBuybackTime;
        uint256 periodsElapsed = elapsed / cooldownPeriod;
        uint256 currentIncentiveBps = baseIncentiveBps + (periodsElapsed * baseIncentiveBps);

        if (currentIncentiveBps > maxIncentiveBps) {
            return maxIncentiveBps;
        }

        return currentIncentiveBps;
    }
}
