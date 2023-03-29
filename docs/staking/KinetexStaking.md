# Solidity API

## KinetexStaking

Allows Kinetex Rewards holders stake their tokens to get access to Kinetex DAO.

### Staker

```solidity
struct Staker {
  uint256[] stakedTokenIds;
  uint256 timeOfLastUpdate;
  uint256 votingPower;
  uint256 unclaimedRewards;
  uint256 claimedRewards;
}
```

### StakingCondition

```solidity
struct StakingCondition {
  uint256 tokenId;
  uint256 startTimestamp;
  uint256 endTimestamp;
  uint256 totalRewards;
  uint256 unclaimedRewards;
  uint256 claimedRewards;
}
```

### stakers

```solidity
mapping(address => struct KinetexStaking.Staker) stakers
```

### stakerAddress

```solidity
mapping(uint256 => address) stakerAddress
```

### tokenIdToArrayIndex

```solidity
mapping(uint256 => uint256) tokenIdToArrayIndex
```

### tokenIdToStakingCondition

```solidity
mapping(uint256 => struct KinetexStaking.StakingCondition) tokenIdToStakingCondition
```

### Stake

```solidity
event Stake(uint256[] tokenIds, address staker)
```

### Withdraw

```solidity
event Withdraw(uint256[] tokenIds, address staker)
```

### constructor

```solidity
constructor() public
```

### hasRewardToken

```solidity
modifier hasRewardToken()
```

@notice Modifier for functions that are only available when the rewards token is set.

### initialize

```solidity
function initialize(address nftCollection) public
```

@notice                 Initialize the contract and grant roles to the deployer
 @dev                    Reward token is not initialized, but decimals are needed for correct voting power calculations
 @param nftCollection    KinetexRewards deployed instance

### stake

```solidity
function stake(uint256[] _tokenIds, uint256 _periods) external
```

@notice             Stakes an array of tokenIds
 @dev                Periods are used to calculate the initial voting power for a staker.
 @param _tokenIds    TokenIds to stake
 @param _periods     How many periods a user wants to stake. Refer to BASE_PERIOD.

### votingPower

```solidity
function votingPower(address account) external view returns (uint256)
```

@notice         Voting power calulation
 @dev            If the token exists, power received on market purchase of token is added
 @param account  Address to calculate the voting power for

### votingPower721

```solidity
function votingPower721(address account) external view returns (uint256)
```

@notice         Pure NFT voting power
 @dev            This function might be needed in the transition period when the rewardsToken is set

### withdraw

```solidity
function withdraw(uint256[] _tokenIds) external
```

@notice             Withdraws the staked tokenIds
 @param _tokenIds    TokenIds to withdraw

### setRewardsToken

```solidity
function setRewardsToken(address _token, uint256 _decimals) external
```

@notice             Sets the reward token
 @param _token       Address of the ERC20 token instance
 @param _decimals    Decimals of the token

### claimRewards

```solidity
function claimRewards() external
```

@notice If the rewards token is set, allows to claim accumulated rewards

### _updateRewards

```solidity
function _updateRewards(address _staker) internal
```

@dev            Reward calculation triggered on a staker state update.
 @param _staker  Staker address

### _availableRewards

```solidity
function _availableRewards(struct KinetexStaking.StakingCondition stakingCondition, uint256 tokenId) internal view returns (uint256)
```

@dev                     Calculates accumulated rewards in the current time
 @param stakingCondition  Staking configuration of the token
 @param tokenId           tokenId

### _calculateReward

```solidity
function _calculateReward(uint256 _tokenId, uint256 _periods) internal view returns (uint256)
```

@dev                     Calculates accumulated rewards for a given amount of time
 @param _tokenId          tokenId
 @param _periods          Ellapsed periods. Refer to BASE_PERIOD

### _calculateEndTimeStamp

```solidity
function _calculateEndTimeStamp(uint256 startTimeStamp, uint256 periods) internal pure returns (uint256)
```

@dev                     Calculates the timestamp for the end of staking
 @param startTimeStamp    Unix timestamp of staking start
 @param periods           How many periods to stake for

### _getTokenProperties

```solidity
function _getTokenProperties(uint256 tokenId) internal view returns (uint256, enum Levels.Level)
```

@dev              Retrieves the onchain metadata for a given tokenId
 @param tokenId    tokenId

### _stakingPeriods

```solidity
function _stakingPeriods(uint256 _startDate, uint256 _endDate) internal pure returns (uint256)
```

@dev                 Calculates the amount of staking periods between two dates
 @param _startDate    Start date Unix timestamp. Should be less than _endDate
 @param _endDate      Start date Unix timestamp. Should be greater than _startDate

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal
```

@dev UUPS proxy upgrade

