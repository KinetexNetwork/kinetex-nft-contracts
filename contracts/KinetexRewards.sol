// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";

import {Levels} from "./libraries/Levels.sol";
import {IKinetexRewards} from "./IKinetexRewards.sol";
import {ISignatureManager} from "./cryptography/ISignatureManager.sol";
import {IERC4906} from "./eip/IERC4906.sol";

/**
 * @title                   Kinetex Rewards
 * @author                  Kinetex Team
 * @notice                  ERC721 Collection designed for crafting and staking capabilities.
 * @custom:security-contact semkin.eth@gmail.com
 **/
contract KinetexRewards is
    IKinetexRewards,
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

    address private _signatureManager;
    address private _stakingContract;

    mapping(uint256 => Attributes) internal _attributesByTokenId;

    uint256[96] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     *  @notice                 Initialize the contract and grant roles to the deployer
     *  @dev                    Proxy initializer
     *  @param signatureManager SignatureManager deployed instance
     */
    function initialize(address signatureManager) public initializer {
        __ERC721_init("Kinetex Rewards", "KTXR");
        __ERC721Burnable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);

        _signatureManager = signatureManager;
    }

    /**
     *  @notice Mints a token if the signature is valid. Refer to IKinetexRewards.sol
     *  @dev    Needs to be granted MANAGER role on SignatureManager instance
     */
    function safeMint(
        address _to,
        uint256 _dust,
        uint256 _nonce,
        bytes calldata _signature
    ) external {
        require(
            ISignatureManager(_signatureManager).verifySpending(_to, _dust, _nonce, _signature) ==
                true,
            "KR: Issuer signature mismatch"
        );
        ISignatureManager(_signatureManager).useSignature(_signature);

        _setAttributesAndMint(_to, _dust);
    }

    /**
     *  @notice Mints a token if called by a priveled account. Refer to IKinetexRewards.sol
     */
    function safeMintPriveleged(address _to, uint256 _dust) external onlyRole(MINTER_ROLE) {
        _setAttributesAndMint(_to, _dust);
    }

    /**
     *  @notice Token burn. Refer to IKinetexRewards.sol
     */
    function burn(uint256 _tokenId) public override(ERC721BurnableUpgradeable, IKinetexRewards) {
        delete _attributesByTokenId[_tokenId];
        super.burn(_tokenId);
        emit Burn(_tokenId);
    }

    /**
     *  @notice Token burn that doesn't require approval. Refer to IKinetexRewards.sol
     */
    function burnPriveleged(uint256 _tokenId) external onlyRole(BURNER_ROLE) {
        delete _attributesByTokenId[_tokenId];
        _burn(_tokenId);
        emit Burn(_tokenId);
    }

    /**
     *  @notice Sets the baseURI. Refer to IKinetexRewards.sol
     */
    function setBaseURI(string calldata _uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = _uri;
        emit BatchMetadataUpdate(0, _tokenIdCounter.current());
        emit SetBaseURI(_uri);
    }

    /**
     *  @notice Sets the contractURI. Refer to IKinetexRewards.sol
     */
    function setContractURI(string calldata _uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        contractMetadataURI = _uri;
        emit SetContractURI(_uri);
    }

    /**
     *  @notice                 Sets the staking contract.
     *  @param stakingContract  Address of the KinetexStaking instance
     */
    function setStakingContract(address stakingContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _stakingContract = stakingContract;
    }

    /**
     *  @notice         Retrieves a token's dust value.
     *  @param _tokenId token Id.
     */
    function getDust(uint256 _tokenId) external view returns (uint256) {
        return _attributesByTokenId[_tokenId].dust;
    }

    /**
     *  @notice         Retrieves onchain metadata.
     *  @param _tokenId token Id.
     */
    function getAttributes(uint256 _tokenId) external view returns (Attributes memory) {
        return _attributesByTokenId[_tokenId];
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
     *  @dev Updates onchain metadata and calls the _safeMint on ERC721.
     */
    function _setAttributesAndMint(address _to, uint256 _dust) internal {
        uint256 tokenId = _tokenIdCounter.current();
        Levels.Level level = Levels.getLevelByDustAmount(_dust);

        _attributesByTokenId[tokenId] = Attributes(level, _dust);

        _tokenIdCounter.increment();
        _safeMint(_to, tokenId);

        emit Mint(tokenId, Attributes(level, _dust));
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
