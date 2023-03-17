// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {Levels} from "./libraries/Levels.sol";
import {IKinetexRewards} from "./IKinetexRewards.sol";

contract KinetexRewards is
    IKinetexRewards,
    Initializable,
    ERC721Upgradeable,
    ERC721BurnableUpgradeable,
    AccessControlUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdCounter;

    struct Attributes {
        Levels.Level level;
        uint256 dust;
    }

    bytes32 public constant MINTER_ROLE = keccak256(abi.encodePacked("MINTER_ROLE"));
    bytes32 public constant BURNER_ROLE = keccak256(abi.encodePacked("BURNER_ROLE"));
    string public baseURI;

    mapping(uint256 => Attributes) internal _attributesByTokenId;

    event Mint(uint256 tokenId, Attributes attributes);
    event Burn(uint256 tokenId);
    event SetBaseURI(string uri);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC721_init("Kinetex Rewards", "KTXR");
        __ERC721Burnable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }

    function safeMint(address to, uint256 dust) public onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        Levels.Level level = Levels.getLevelByDustAmount(dust);

        _attributesByTokenId[tokenId] = Attributes(level, dust);

        _tokenIdCounter.increment();
        _safeMint(to, tokenId);

        emit Mint(tokenId, Attributes(level, dust));
    }

    function burn(uint256 tokenId) public override(ERC721BurnableUpgradeable, IKinetexRewards) {
        delete _attributesByTokenId[tokenId];
        super.burn(tokenId);
        emit Burn(tokenId);
    }

    function burnPriveleged(uint256 tokenId) external onlyRole(BURNER_ROLE) {
        delete _attributesByTokenId[tokenId];
        _burn(tokenId);
        emit Burn(tokenId);
    }

    function setBaseURI(string calldata uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = uri;
        emit SetBaseURI(uri);
    }

    function getDust(uint256 tokenId) external view returns (uint256) {
        return _attributesByTokenId[tokenId].dust;
    }

    function getNextTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
