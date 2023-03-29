# Solidity API

## SignatureManager

Verifies and stores the signatures signed by an issuer entity.

### MANAGER_ROLE

```solidity
bytes32 MANAGER_ROLE
```

### _issuer

```solidity
address _issuer
```

### _usedSignatures

```solidity
mapping(bytes => bool) _usedSignatures
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address issuer) public
```

@notice       Initialize the contract and grant roles to the deployer
 @dev          Proxy initializer
 @param issuer Signature provider EOA

### verifySpending

```solidity
function verifySpending(address _to, uint256 _dust, uint256 _nonce, bytes _signature) external view returns (bool)
```

@dev Verifies if signature is currently active. Refer to ISignatureManager.sol

### setIssuer

```solidity
function setIssuer(address issuer) external
```

@notice       Updates the current signature provider in storage
 @param issuer Signature provider EOA

### useSignature

```solidity
function useSignature(bytes _signature) external
```

@dev Sets the signature as used. Refer to ISignatureManager.sol

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal
```

@dev UUPS proxy upgrade

