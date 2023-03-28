// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import {Levels} from "./libraries/Levels.sol";
import {IKinetexRewards} from "./IKinetexRewards.sol";
import {ISignatureManager} from "./cryptography/ISignatureManager.sol";

contract KinetexRewards is
    IKinetexRewards,
    Initializable,
    ERC721Upgradeable,
    ERC721BurnableUpgradeable,
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

    mapping(uint256 => Attributes) internal _attributesByTokenId;

    uint256[96] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address signatureManager) public initializer {
        __ERC721_init("Kinetex Rewards", "KTXR");
        __ERC721Burnable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);

        _signatureManager = signatureManager;
    }

    function safeMint(
        address _to,
        uint256 _dust,
        bytes calldata _signature
    ) external {
        require(
            ISignatureManager(_signatureManager).verifySpending(_to, _dust, _signature) == true,
            "KR: Issuer signature mismatch"
        );
        ISignatureManager(_signatureManager).useSignature(_signature);

        _setAttributesAndMint(_to, _dust);
    }

    function safeMintPriveleged(address _to, uint256 _dust) external onlyRole(MINTER_ROLE) {
        _setAttributesAndMint(_to, _dust);
    }

    function burn(uint256 _tokenId) public override(ERC721BurnableUpgradeable, IKinetexRewards) {
        delete _attributesByTokenId[_tokenId];
        super.burn(_tokenId);
        emit Burn(_tokenId);
    }

    function burnPriveleged(uint256 _tokenId) external onlyRole(BURNER_ROLE) {
        delete _attributesByTokenId[_tokenId];
        _burn(_tokenId);
        emit Burn(_tokenId);
    }

    function setBaseURI(string calldata _uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = _uri;
        emit SetBaseURI(_uri);
    }

    function setContractURI(string calldata _uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        contractMetadataURI = _uri;
        emit SetContractURI(_uri);
    }

    function getDust(uint256 _tokenId) external view returns (uint256) {
        return _attributesByTokenId[_tokenId].dust;
    }

    function getAttributes(uint256 _tokenId) external view returns (Attributes memory) {
        return _attributesByTokenId[_tokenId];
    }

    function getNextTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function contractURI() external view returns (string memory) {
        return contractMetadataURI;
    }

    function _setAttributesAndMint(address _to, uint256 _dust) internal {
        uint256 tokenId = _tokenIdCounter.current();
        Levels.Level level = Levels.getLevelByDustAmount(_dust);

        _attributesByTokenId[tokenId] = Attributes(level, _dust);

        _tokenIdCounter.increment();
        _safeMint(_to, tokenId);

        emit Mint(tokenId, Attributes(level, _dust));
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}
}
