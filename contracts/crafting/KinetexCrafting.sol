// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import {IKinetexRewards} from "../IKinetexRewards.sol";
import {Levels} from "../libraries/Levels.sol";

/// @custom:security-contact vasemkin@ya.ru
contract KinetexCrafting is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    IKinetexRewards private kinetexRewards;
    address private kinetexRewardsAddress;

    uint256[98] private __gap;

    event Craft(uint256 tokenA, uint256 tokenB, uint256 tokenId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _kinetexRewards) public initializer {
        require(address(_kinetexRewards) != address(0), "KC: KinetexRewards address zero");
        __Ownable_init();
        __UUPSUpgradeable_init();
        kinetexRewards = IKinetexRewards(_kinetexRewards);
        kinetexRewardsAddress = _kinetexRewards;
    }

    function craft(uint256 tokenA, uint256 tokenB) external {
        require(
            IERC721(kinetexRewardsAddress).ownerOf(tokenA) == msg.sender,
            "KC: Not the owner of tokenA"
        );
        require(
            IERC721(kinetexRewardsAddress).ownerOf(tokenB) == msg.sender,
            "KC: Not the owner of tokenB"
        );

        uint256 totalDust = kinetexRewards.getDust(tokenA) + kinetexRewards.getDust(tokenB);
        uint256 tokenId = kinetexRewards.getNextTokenId();

        kinetexRewards.burn(tokenA);
        kinetexRewards.burn(tokenB);
        kinetexRewards.safeMintPriveleged(msg.sender, totalDust);

        emit Craft(tokenA, tokenB, tokenId);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
