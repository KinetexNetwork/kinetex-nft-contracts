# Solidity API

## Levels

### Level

```solidity
enum Level {
  DUST,
  GEM,
  CRYSTAL,
  LIGHTNING
}
```

### getLevelByDustAmount

```solidity
function getLevelByDustAmount(uint256 dust) internal pure returns (enum Levels.Level)
```

### _getDustPercentage

```solidity
function _getDustPercentage(enum Levels.Level level, uint256 months) internal pure returns (uint256 dustPercentage)
```

