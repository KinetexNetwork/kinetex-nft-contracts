# Solidity API

## KinetexRewards

ERC721 Collection designed for crafting and staking capabilities.

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### BURNER_ROLE

```solidity
bytes32 BURNER_ROLE
```

### baseURI

```solidity
string baseURI
```

### contractMetadataURI

```solidity
string contractMetadataURI
```

### _attributesByTokenId

```solidity
mapping(uint256 => struct IKinetexRewards.Attributes) _attributesByTokenId
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address signatureManager) public
```

@notice                 Initialize the contract and grant roles to the deployer
 @dev                    Proxy initializer
 @param signatureManager SignatureManager deployed instance

### safeMint

```solidity
function safeMint(address _to, uint256 _dust, uint256 _nonce, bytes _signature) external
```

@notice Mints a token if the signature is valid. Refer to IKinetexRewards.sol
 @dev    Needs to be granted MANAGER role on SignatureManager instance

### safeMintPriveleged

```solidity
function safeMintPriveleged(address _to, uint256 _dust) external
```

@notice Mints a token if called by a priveled account. Refer to IKinetexRewards.sol

### burn

```solidity
function burn(uint256 _tokenId) public
```

@notice Token burn. Refer to IKinetexRewards.sol

### burnPriveleged

```solidity
function burnPriveleged(uint256 _tokenId) external
```

@notice Token burn that doesn't require approval. Refer to IKinetexRewards.sol

### setBaseURI

```solidity
function setBaseURI(string _uri) external
```

@notice Sets the baseURI. Refer to IKinetexRewards.sol

### setContractURI

```solidity
function setContractURI(string _uri) external
```

@notice Sets the contractURI. Refer to IKinetexRewards.sol

### setStakingContract

```solidity
function setStakingContract(address stakingContract) external
```

@notice                 Sets the staking contract.
 @param stakingContract  Address of the KinetexStaking instance

### getDust

```solidity
function getDust(uint256 _tokenId) external view returns (uint256)
```

@notice         Retrieves a token's dust value.
 @param _tokenId token Id.

### getAttributes

```solidity
function getAttributes(uint256 _tokenId) external view returns (struct IKinetexRewards.Attributes)
```

@notice         Retrieves onchain metadata.
 @param _tokenId token Id.

### getNextTokenId

```solidity
function getNextTokenId() external view returns (uint256)
```

@notice Retrieves the tokenId for the next mint
 @dev    Can be used to retrieve total supply.

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

@notice EIP165

### contractURI

```solidity
function contractURI() external view returns (string)
```

@notice Contract metadata

### _setAttributesAndMint

```solidity
function _setAttributesAndMint(address _to, uint256 _dust) internal
```

@dev Updates onchain metadata and calls the _safeMint on ERC721.

### _baseURI

```solidity
function _baseURI() internal view returns (string)
```

@dev Override for baseURI upgradability

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal
```

@dev UUPS proxy upgrade

