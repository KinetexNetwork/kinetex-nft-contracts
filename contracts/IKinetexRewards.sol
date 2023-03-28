// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Levels} from "./libraries/Levels.sol";

interface IKinetexRewards {
    /// @dev Emitted when an NFT is minted.
    event Mint(uint256 tokenId, Attributes attributes);

    /// @dev Emitted when an nft is burned.
    event Burn(uint256 tokenId);

    /// @dev Emitted when the base_uri us updated.
    event SetBaseURI(string uri);

    /// @dev Emitted when the contract_uri us updated.
    event SetContractURI(string uri);

    /**
     *  @notice         Dust NFT Attributes.
     *  @param level    Pover level value for metadata.
     *  @param _dust    Number value for crafting and staking power.
     */
    struct Attributes {
        Levels.Level level;
        uint256 dust;
    }

    /**
     *  @notice Initializer.
     */
    function initialize(address issuer) external;

    /**
     *  @notice               Mints an NFT, validating the issuer's signature.
     *  @param _to            The address that will receive the NFT.
     *  @param _dust          How much rewards are spent for the mint.
     *  @param _dust          Allows to provide a valid signature for the same values.
     *  @param _signature     hash of solidityPack(["address _to", "uint256 _dust"] signed by the issuer.
     */
    function safeMint(
        address _to,
        uint256 _dust,
        uint256 _nonce,
        bytes calldata _signature
    ) external;

    /**
     *  @notice          Mints an NFT.
     *  @param _to       The address that will receive the NFT.
     *  @param _dust     How much rewards are spent for the mint.
     */
    function safeMintPriveleged(address _to, uint256 _dust) external;

    /**
     *  @notice          Burns an NFT.
     *  @param _tokenId  token to burn.
     */
    function burn(uint256 _tokenId) external;

    /**
     *  @notice          Access-control gated burn.
     *  @param _tokenId  token to burn.
     */
    function burnPriveleged(uint256 _tokenId) external;

    /**
     *  @notice      Sets the metadata uri.
     *  @param _uri  Metadata base uri.
     */
    function setBaseURI(string calldata _uri) external;

    /**
     *  @notice      Sets the contract uri.
     *  @param _uri  Contract uri.
     */
    function setContractURI(string calldata _uri) external;

    /**
     *  @notice          Returns a token's Power.
     *  @param _tokenId  token _o check.
     */
    function getDust(uint256 _tokenId) external view returns (uint256);

    /**
     *  @notice Returns the ID that will be assigned to the next minted NFT.
     */
    function getNextTokenId() external view returns (uint256);
}
