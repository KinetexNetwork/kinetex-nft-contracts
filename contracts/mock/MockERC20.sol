// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @custom:security-contact vasemkin@ya.ru
contract MockERC20 is ERC20, Ownable {
    constructor(address stakingContract) ERC20("MockERC20", "MOCK") {
        _mint(stakingContract, 10000000 ether);
    }
}
