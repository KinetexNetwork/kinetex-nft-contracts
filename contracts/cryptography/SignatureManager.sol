// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

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
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 public constant CONSUMER_ROLE = keccak256(abi.encodePacked("CONSUMER_ROLE"));

    mapping(address => uint256) internal _consumerIdByAddress;
    mapping(uint256 => address) internal _issuerByConsumerId;
    mapping(uint256 => mapping(bytes => bool)) internal _usedSignaturesByConsumer;

    CountersUpgradeable.Counter private _consumerIdCounter;

    uint256[98] private __gap;

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

        _consumerIdCounter.increment();
    }

    /**
     *  @notice       Registeres a consumer
     *  @dev          Refer Refer to ISignatureManager.sol
     */
    function registerConsumer(address _consumer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_consumerIdByAddress[_consumer] == 0, "SM: Consumer already registered");
        uint256 _consumerId = _consumerIdCounter.current();
        _consumerIdByAddress[_consumer] = _consumerId;
        _consumerIdCounter.increment();
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
        uint256 _consumerId
    ) external view returns (bool) {
        require(_issuerByConsumerId[_consumerId] != address(0), "SM: Issuer not set for consumer");

        bytes32 hash = keccak256(abi.encodePacked(_to, _attribute, _nonce));
        bytes32 message = ECDSA.toEthSignedMessageHash(hash);
        address _issuer = _issuerByConsumerId[_consumerId];
        return (ECDSA.recover(message, _signature) == _issuer &&
            !_usedSignaturesByConsumer[_consumerId][_signature]);
    }

    /**
     *  @dev Refer to ISignatureManager.sol
     */
    function setIssuerForConsumer(address _issuer, address _consumer)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        uint256 _consumerId = _consumerIdByAddress[_consumer];
        require(_consumerId != 0, "SM: Consumer not registered");
        _issuerByConsumerId[_consumerId] = _issuer;
    }

    /**
     *  @dev Refer to ISignatureManager.sol
     */
    function setIssuer(address _issuer) external onlyRole(CONSUMER_ROLE) {
        uint256 _consumerId = _consumerIdByAddress[msg.sender];
        _issuerByConsumerId[_consumerId] = _issuer;
    }

    /**
     *  @dev Refer to ISignatureManager.sol
     */
    function useSignature(bytes calldata _signature) external onlyRole(CONSUMER_ROLE) {
        uint256 _consumerId = _consumerIdByAddress[msg.sender];
        _usedSignaturesByConsumer[_consumerId][_signature] = true;
    }

    /**
     *  @dev Refer to ISignatureManager.sol
     */
    function getConsumerId(address _consumer) external view returns (uint256) {
        return _consumerIdByAddress[_consumer];
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
