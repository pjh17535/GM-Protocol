// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract GMToken is ERC20, ERC20Burnable, Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant INITIAL_SUPPLY = 10_000_000_000 * 10 ** 18;

    error CannotRescueNativeToken();

    constructor(address initialHolder) ERC20("gArc", "gARC") Ownable(msg.sender) {
        _mint(initialHolder, INITIAL_SUPPLY);
    }

    function rescueERC20(address token, address to, uint256 amount) external onlyOwner {
        if (token == address(this)) {
            revert CannotRescueNativeToken();
        }

        IERC20(token).safeTransfer(to, amount);
    }
}
