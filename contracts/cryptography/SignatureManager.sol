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
    bytes32 public constant MANAGER_ROLE = keccak256(abi.encodePacked("MANAGER_ROLE"));

    address internal _issuer;
    mapping(bytes => bool) internal _usedSignatures;

    uint256[98] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     *  @notice       Initialize the contract and grant roles to the deployer
     *  @dev          Proxy initializer
     *  @param issuer Signature provider EOA
     */
    function initialize(address issuer) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
        _issuer = issuer;
    }

    /**
     *  @dev Verifies if signature is currently active. Refer to ISignatureManager.sol
     */
    function verifySpending(
        address _to,
        uint256 _dust,
        uint256 _nonce,
        bytes calldata _signature
    ) external view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(_to, _dust, _nonce));
        bytes32 message = ECDSA.toEthSignedMessageHash(hash);
        return (ECDSA.recover(message, _signature) == _issuer && !_usedSignatures[_signature]);
    }

    /**
     *  @notice       Updates the current signature provider in storage
     *  @param issuer Signature provider EOA
     */
    function setIssuer(address issuer) external onlyRole(MANAGER_ROLE) {
        _issuer = issuer;
    }

    /**
     *  @dev Sets the signature as used. Refer to ISignatureManager.sol
     */
    function useSignature(bytes calldata _signature) external onlyRole(MANAGER_ROLE) {
        _usedSignatures[_signature] = true;
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
