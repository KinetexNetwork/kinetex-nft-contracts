// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ISignatureManager {
    /**
     *  @notice Determines if a user is eligible to spend dust.
     *
     *  @param _to            The address that will receive the NFT.
     *
     *  @param _dust          How much rewards are spent for the mint.
     *
     *  @param _signature     hash of solidityPack(["address _to", "uint256 _dust"] signed by the issuer.
     */
    function verifySpending(
        address _to,
        uint256 _dust,
        bytes calldata _signature
    ) external view returns (bool);

    /**
     *  @notice Sets the signature as used.
     *
     *  @param _signature     hash of solidityPack(["address _to", "uint256 _dust"] signed by the issuer.
     */
    function useSignature(bytes calldata _signature) external;
}
