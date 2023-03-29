# Solidity API

## IKinetexRewards

### Mint

```solidity
event Mint(uint256 tokenId, struct IKinetexRewards.Attributes attributes)
```

_Emitted when an NFT is minted._

### Burn

```solidity
event Burn(uint256 tokenId)
```

_Emitted when an nft is burned._

### SetBaseURI

```solidity
event SetBaseURI(string uri)
```

_Emitted when the base_uri us updated._

### SetContractURI

```solidity
event SetContractURI(string uri)
```

_Emitted when the contract_uri us updated._

### Attributes

```solidity
struct Attributes {
  enum Levels.Level level;
  uint256 dust;
}
```

### initialize

```solidity
function initialize(address issuer) external
```

@notice Initializer.

### safeMint

```solidity
function safeMint(address _to, uint256 _dust, uint256 _nonce, bytes _signature) external
```

@notice               Mints an NFT, validating the issuer's signature.
 @param _to            The address that will receive the NFT.
 @param _dust          How much rewards are spent for the mint.
 @param _dust          Allows to provide a valid signature for the same values.
 @param _signature     hash of solidityPack(["address _to", "uint256 _dust"] signed by the issuer.

### safeMintPriveleged

```solidity
function safeMintPriveleged(address _to, uint256 _dust) external
```

@notice          Mints an NFT.
 @param _to       The address that will receive the NFT.
 @param _dust     How much rewards are spent for the mint.

### burn

```solidity
function burn(uint256 _tokenId) external
```

@notice          Burns an NFT.
 @param _tokenId  token to burn.

### burnPriveleged

```solidity
function burnPriveleged(uint256 _tokenId) external
```

@notice          Access-control gated burn.
 @param _tokenId  token to burn.

### setBaseURI

```solidity
function setBaseURI(string _uri) external
```

@notice      Sets the metadata uri.
 @param _uri  Metadata base uri.

### setContractURI

```solidity
function setContractURI(string _uri) external
```

@notice      Sets the contract uri.
 @param _uri  Contract uri.

### getDust

```solidity
function getDust(uint256 _tokenId) external view returns (uint256)
```

@notice          Returns a token's Power.
 @param _tokenId  token _o check.

### getNextTokenId

```solidity
function getNextTokenId() external view returns (uint256)
```

@notice Returns the ID that will be assigned to the next minted NFT.

