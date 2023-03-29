# Solidity API

## KinetexCrafting

Allows Kinetex Rewards holders to combine attributes of their tokens.

### Craft

```solidity
event Craft(uint256 tokenA, uint256 tokenB, uint256 tokenId)
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address _kinetexRewards) public
```

@notice                 Initialize the contract and grant roles to the deployer
 @dev                    Proxy initializer
 @param _kinetexRewards  KinetexRewards deployed instance

### craft

```solidity
function craft(uint256 _tokenA, uint256 _tokenB) external
```

@notice         Burns the provided tokens and mints a new one with combined attributes
 @dev            Needs to be granted MINTER role on KinetexRewards instance
 @param _tokenA  TokenId of first token to burn
 @param _tokenB  TokenId of second token to burn

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal
```

@dev UUPS proxy upgrade

