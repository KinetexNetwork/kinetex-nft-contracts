# Solidity API

## ISignatureManager

### verifySpending

```solidity
function verifySpending(address _to, uint256 _dust, uint256 _nonce, bytes _signature) external view returns (bool)
```

@notice               Determines if a user is eligible to spend dust.
 @param _to            The address that will receive the NFT.
 @param _dust          How much rewards are spent for the mint.
 @param _nonce         Allows to make a new valid signature for the same values.
 @param _signature     hash of solidityPack(["address _to", "uint256 _dust"] signed by the issuer.

### useSignature

```solidity
function useSignature(bytes _signature) external
```

@notice               Sets the signature as used.
 @param _signature     hash of solidityPack(["address _to", "uint256 _dust"] signed by the issuer.

