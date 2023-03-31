// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import {ISignatureManager} from "./ISignatureManager.sol";

/**
 * @title                   Signature Manager
 * @author                  Kinetex Team
 * @notice                  Verifies and stores the signatures signed by an issuer entity.
 * @custom:security-contact semkin.eth@gmail.com
 **/
contract SignatureManager is
    ISignatureManager,
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant CONSUMER_ROLE = keccak256(abi.encodePacked("CONSUMER_ROLE"));

    mapping(address => address) internal _issuerByConsumerAddress;
    mapping(address => mapping(bytes => bool)) internal _usedSignaturesByConsumer;

    uint256[97] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     *  @notice       Initialize the contract and grant roles to the deployer
     *  @dev          Proxy initializer. _consumerIdCounter starts from 1.
     */
    function initialize() public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     *  @notice       Registeres a consumer
     *  @dev          Refer Refer to ISignatureManager.sol
     */
    function registerConsumer(address _consumer, address _issuer)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            _issuerByConsumerAddress[_consumer] == address(0),
            "SM: Consumer already registered"
        );
        _issuerByConsumerAddress[_consumer] = _issuer;
    }

    /**
     *  @notice    Checks is a signature is valid and not used already
     *  @dev       Refer to ISignatureManager.sol
     */
    function verifySignature(
        address _to,
        uint256 _attribute,
        uint256 _nonce,
        bytes calldata _signature,
        address _consumer
    ) external view returns (bool) {
        address _issuer = _issuerByConsumerAddress[_consumer];
        require(_issuer != address(0), "SM: No issuer for consumer");

        bytes32 hash = keccak256(abi.encodePacked(_to, _attribute, _nonce));
        bytes32 message = ECDSA.toEthSignedMessageHash(hash);
        return (ECDSA.recover(message, _signature) == _issuer &&
            !_usedSignaturesByConsumer[_consumer][_signature]);
    }

    /**
     *  @dev Refer to ISignatureManager.sol
     */
    function setIssuer(address _issuer) external onlyRole(CONSUMER_ROLE) {
        _issuerByConsumerAddress[msg.sender] = _issuer;
    }

    /**
     *  @dev Refer to ISignatureManager.sol
     */
    function useSignature(bytes calldata _signature) external onlyRole(CONSUMER_ROLE) {
        _usedSignaturesByConsumer[msg.sender][_signature] = true;
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
