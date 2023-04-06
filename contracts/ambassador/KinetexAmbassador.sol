// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";

import {IERC4906} from "../eip/IERC4906.sol";
import {IERC5192} from "../eip/IERC5192.sol";

import {RewardLevels} from "../libraries/RewardLevels.sol";
import {ISignatureManager} from "../cryptography/ISignatureManager.sol";

import {IKinetexRewards} from "../rewards/IKinetexRewards.sol";

/**
 * @title                   Kinetex Ambassador
 * @author                  Kinetex Team
 * @notice                  ERC721 Collection for Kinetex Network ambassadors.
 * @custom:security-contact semkin.eth@gmail.com
 **/
contract KinetexAmbassador is
    Initializable,
    ERC721Upgradeable,
    ERC721BurnableUpgradeable,
    IERC4906,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdCounter;

    bytes32 public constant MINTER_ROLE = keccak256(abi.encodePacked("MINTER_ROLE"));
    bytes32 public constant BURNER_ROLE = keccak256(abi.encodePacked("BURNER_ROLE"));
    string public baseURI;
    string public contractMetadataURI;

    uint256 public constant REWARDS_PER_BURN = 100**18;
    bool public burnRewardUnlocked;

    address private _signatureManager;
    address private _kinetexRewards;

    enum Level {
        JUNIOR,
        MASTER,
        MAGISTER,
        LEGENDARY
    }

    mapping(uint256 => Level) internal _levelByTokenId;
    mapping(Level => uint256) internal _maxSupplyByLevel;
    mapping(Level => uint256) internal _supplyByLevel;

    uint256[89] private __gap;

    /// @dev Emitted when an NFT is minted.
    event Mint(uint256 tokenId, Level level);

    /// @dev Emitted when an nft is burned.
    event Burn(uint256 tokenId);

    /// @dev Emitted when the base_uri us updated.
    event SetBaseURI(string uri);

    /// @dev Emitted when the contract_uri us updated.
    event SetContractURI(string uri);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     *  @notice                 Initialize the contract and grant roles to the deployer
     *  @dev                    Proxy initializer
     *  @param signatureManager SignatureManager deployed instance
     *  @param kinetexRewards   KinetexRewards deployed instance
     */
    function initialize(address signatureManager, address kinetexRewards) public initializer {
        __ERC721_init("Kinetex Ambassador", "KTXA");
        __ERC721Burnable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);

        _signatureManager = signatureManager;
        _kinetexRewards = kinetexRewards;

        _maxSupplyByLevel[Level.JUNIOR] = 300;
        _maxSupplyByLevel[Level.MASTER] = 50;
        _maxSupplyByLevel[Level.MAGISTER] = 25;
        _maxSupplyByLevel[Level.LEGENDARY] = 3;
    }

    /**
     *  @notice Mints a token if the signature is valid. Refer to IKinetexRewards.sol
     *  @dev    Needs to be granted MANAGER role on SignatureManager instance
     */
    function safeMint(
        address _to,
        uint256 _level,
        uint256 _nonce,
        bytes calldata _signature
    ) external {
        ISignatureManager signatureManager = ISignatureManager(_signatureManager);

        require(
            signatureManager.verifySignature(_to, _level, _nonce, _signature, address(this)) ==
                true,
            "KA: Issuer signature mismatch"
        );

        signatureManager.useSignature(_signature);

        _setAttributesAndMint(_to, _level);
    }

    /**
     *  @notice Mints a token if called by a priveled account. Refer to IKinetexRewards.sol
     */
    function safeMintPriveleged(address _to, uint256 _level) external onlyRole(MINTER_ROLE) {
        _setAttributesAndMint(_to, _level);
    }

    /**
     *  @notice Token burn. Refer to IKinetexRewards.sol
     */
    function burn(uint256 _tokenId) public override(ERC721BurnableUpgradeable) {
        delete _levelByTokenId[_tokenId];
        super.burn(_tokenId);

        if (burnRewardUnlocked) {
            IKinetexRewards(_kinetexRewards).safeMintPriveleged(msg.sender, REWARDS_PER_BURN);
        }

        emit Burn(_tokenId);
    }

    /**
     *  @notice Token burn that doesn't require approval.
     */
    function burnPriveleged(uint256 _tokenId) external onlyRole(BURNER_ROLE) {
        address owner = ownerOf(_tokenId);
        delete _levelByTokenId[_tokenId];
        _burn(_tokenId);
        IKinetexRewards(_kinetexRewards).safeMintPriveleged(owner, REWARDS_PER_BURN);
        emit Burn(_tokenId);
    }

    /**
     *  @notice Sets the baseURI.
     */
    function setBaseURI(string calldata _uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = _uri;
        emit BatchMetadataUpdate(0, _tokenIdCounter.current());
        emit SetBaseURI(_uri);
    }

    /**
     *  @notice Sets the contractURI.
     */
    function setContractURI(string calldata _uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        contractMetadataURI = _uri;
        emit SetContractURI(_uri);
    }

    /**
     *  @notice Updates the max supply per level.
     */
    function setMaxSupplyForLevel(uint256 _level, uint256 _supply)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _maxSupplyByLevel[Level(_level)] = _supply;
    }

    /**
     *  @notice         Retrieves onchain metadata.
     *  @param _tokenId token Id.
     */
    function getLevel(uint256 _tokenId) external view returns (Level) {
        return _levelByTokenId[_tokenId];
    }

    /**
     *  @notice Retrieves the tokenId for the next mint
     *  @dev    Can be used to retrieve total supply.
     */
    function getNextTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     *  @notice EIP165
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable, IERC165)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     *  @notice Contract metadata
     */
    function contractURI() external view returns (string memory) {
        return contractMetadataURI;
    }

    /**
     *  @notice Toggles the mint of KinetexReward tokens to burner
     */
    function setBurnReward(bool _status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        burnRewardUnlocked = _status;
    }

    /**
     *  @dev Updates onchain metadata and calls the _safeMint on ERC721.
     */
    function _setAttributesAndMint(address _to, uint256 _level) internal {
        uint256 newSupply = _supplyByLevel[Level(_level)] + 1;
        require(newSupply <= _maxSupplyByLevel[Level(_level)], "KA: Level's max supply reached");

        uint256 tokenId = _tokenIdCounter.current();

        _levelByTokenId[tokenId] = Level(_level);

        _tokenIdCounter.increment();
        _safeMint(_to, tokenId);

        emit Mint(tokenId, Level(_level));

        _supplyByLevel[Level(_level)] = newSupply;
    }

    /**
     *  @dev Override for baseURI upgradability
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /**
     *  @dev UUPS proxy upgrade
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}
}
