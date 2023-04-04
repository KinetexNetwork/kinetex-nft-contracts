// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import {IKinetexRewards} from "../rewards/IKinetexRewards.sol";
import {RewardLevels} from "../libraries/RewardLevels.sol";

/**
 * @title                   Kinetex Crafting
 * @author                  Kinetex Team
 * @notice                  Allows Kinetex Rewards holders to combine attributes of their tokens.
 * @custom:security-contact semkin.eth@gmail.com
 **/
contract KinetexCrafting is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    IKinetexRewards private kinetexRewards;
    address private kinetexRewardsAddress;

    uint256[98] private __gap;

    event Craft(uint256 tokenA, uint256 tokenB, uint256 tokenId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     *  @notice                 Initialize the contract and grant roles to the deployer
     *  @dev                    Proxy initializer
     *  @param _kinetexRewards  KinetexRewards deployed instance
     */
    function initialize(address _kinetexRewards) public initializer {
        require(address(_kinetexRewards) != address(0), "KC: KinetexRewards address zero");
        __Ownable_init();
        __UUPSUpgradeable_init();
        kinetexRewards = IKinetexRewards(_kinetexRewards);
        kinetexRewardsAddress = _kinetexRewards;
    }

    /**
     *  @notice         Burns the provided tokens and mints a new one with combined attributes
     *  @dev            Needs to be granted MINTER role on KinetexRewards instance
     *  @param _tokenA  TokenId of first token to burn
     *  @param _tokenB  TokenId of second token to burn
     */
    function craft(uint256 _tokenA, uint256 _tokenB) external {
        require(
            IERC721(kinetexRewardsAddress).ownerOf(_tokenA) == msg.sender,
            "KC: Not the owner of tokenA"
        );
        require(
            IERC721(kinetexRewardsAddress).ownerOf(_tokenB) == msg.sender,
            "KC: Not the owner of tokenB"
        );

        uint256 totalDust = kinetexRewards.getAttributes(_tokenA).dust +
            kinetexRewards.getAttributes(_tokenB).dust;
        uint256 tokenId = kinetexRewards.getNextTokenId();

        kinetexRewards.burn(_tokenA);
        kinetexRewards.burn(_tokenB);
        kinetexRewards.safeMintPriveleged(msg.sender, totalDust);

        emit Craft(_tokenA, _tokenB, tokenId);
    }

    /**
     *  @dev UUPS proxy upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
