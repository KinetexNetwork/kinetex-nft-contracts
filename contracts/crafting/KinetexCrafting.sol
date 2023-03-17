// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IKinetexRewards} from "../IKinetexRewards.sol";
import {Levels} from "../libraries/Levels.sol";

/// @custom:security-contact vasemkin@ya.ru
contract KinetexCrafting is Initializable, OwnableUpgradeable {
    IKinetexRewards private kinetexRewards;

    event Craft(uint256 tokenA, uint256 tokenB, uint256 tokenId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _kinetexRewards) public initializer {
        __Ownable_init();
        kinetexRewards = IKinetexRewards(_kinetexRewards);
    }

    function craft(uint256 tokenA, uint256 tokenB) external {
        uint256 totalDust = kinetexRewards.getDust(tokenA) + kinetexRewards.getDust(tokenB);
        uint256 tokenId = kinetexRewards.getNextTokenId();

        kinetexRewards.burn(tokenA);
        kinetexRewards.burn(tokenB);
        kinetexRewards.safeMint(msg.sender, totalDust);

        emit Craft(tokenA, tokenB, tokenId);
    }
}
