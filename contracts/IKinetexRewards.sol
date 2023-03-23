// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Levels} from "./libraries/Levels.sol";

interface IKinetexRewards {
    /// @dev Emitted when an NFT is minted.
    event Mint(uint256 tokenId, Attributes attributes);

    /// @dev Emitted when an nft is burned.
    event Burn(uint256 tokenId);

    /// @dev Emitted when the baseURI us updated.
    event SetBaseURI(string uri);

    /// @dev Emitted when the contractURI us updated.
    event SetContractURI(string uri);

    /**
     *  @notice DUST NFT Attributes.
     *
     *  @param level    Pover level value for metadata.
     *
     *  @param dust     Number value for crafting and staking power.
     */
    struct Attributes {
        Levels.Level level;
        uint256 dust;
    }

    /**
     *  @notice Initializer.
     */
    function initialize() external;

    /**
     *  @notice Mints an NFT.
     *
     *  @param to       The address that will receive the NFT.
     *
     *  @param dust     How much rewards are spent for the mint.
     */
    function safeMint(address to, uint256 dust) external;

    /**
     *  @notice Burns an NFT.
     *
     *  @param tokenId  Token to burn.
     */
    function burn(uint256 tokenId) external;

    /**
     *  @notice Access-control gated burn.
     *
     *  @param tokenId  Token to burn.
     */
    function burnPriveleged(uint256 tokenId) external;

    /**
     *  @notice Sets the metadata URI.
     *
     *  @param uri  Metadata base URI.
     */
    function setBaseURI(string calldata uri) external;

    /**
     *  @notice Returns a token's Power.
     *
     *  @param tokenId  Token to check.
     */
    function getDust(uint256 tokenId) external view returns (uint256);

    /**
     *  @notice Returns the ID that will be assigned to the next minted NFT.
     */
    function getNextTokenId() external view returns (uint256);
}
