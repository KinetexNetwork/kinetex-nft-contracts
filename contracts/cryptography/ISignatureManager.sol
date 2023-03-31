// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ISignatureManager {
    /**
     *  @notice               Determines if a user is eligible to spend dust.
     *  @param _to            The address that will receive the NFT.
     *  @param _attribute     Onchain attribute to verify.
     *  @param _nonce         Allows to make a new valid signature for the same values.
     *  @param _signature     Hash of solidityPack(["address _to", "uint256 _attribute", "uint256 _nonce"] signed by the issuer.
     *  @param _consumer      Consumer address
     */
    function verifySignature(
        address _to,
        uint256 _attribute,
        uint256 _nonce,
        bytes calldata _signature,
        address _consumer
    ) external view returns (bool);

    /**
     *  @notice               Registeres a consumer
     *  @param _consumer      Consumer address
     *  @param _issuer        Issuer address
     */
    function registerConsumer(address _consumer, address _issuer) external;

    /**
     *  @notice               Sets the signature as used.
     *  @param _signature     hash of solidityPack(["address _to", "uint256 _dust"] signed by the issuer.
     */
    function useSignature(bytes calldata _signature) external;

    /**
     *  @notice               Allows the consumer contract to set the issuer
     *  @param _issuer        Signature provider EOA address
     */
    function setIssuer(address _issuer) external;
}
