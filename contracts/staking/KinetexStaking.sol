// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import {Levels} from "../libraries/Levels.sol";
import {IKinetexRewards} from "../IKinetexRewards.sol";

contract KinetexStaking is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    address private _rewardsToken;
    address private _nftCollection;

    struct Staker {
        uint256[] stakedTokenIds;
        uint256 timeOfLastUpdate;
        uint256 votingPower;
        uint256 unclaimedRewards;
    }

    struct StakingCondition {
        uint256 tokenId;
        uint256 rewardAmount;
        uint256 startTimestamp;
        uint256 endTimestamp;
    }

    uint256 private constant BASE_PERIOD = 30 days;
    uint256 private rewardTokenDecimals;

    mapping(address => Staker) public stakers;
    mapping(uint256 => address) public stakerAddress;
    mapping(uint256 => uint256) public tokenIdToArrayIndex;
    mapping(uint256 => StakingCondition) public tokenIdToStakingCondition;

    uint256[98] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    modifier ifRewardsTokenSet() {
        require(_rewardsToken != address(0), "KS: Reward token not set");
        _;
    }

    function initialize(address nftCollection) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        _nftCollection = nftCollection;
        rewardTokenDecimals = 18;
    }

    function stake(uint256[] calldata _tokenIds, uint256 _months) external {
        Staker storage staker = stakers[msg.sender];

        uint256 len = _tokenIds.length;
        for (uint256 i; i < len; ++i) {
            require(
                IERC721(_nftCollection).ownerOf(_tokenIds[i]) == msg.sender,
                "KS: Not the token owner"
            );
            IERC721(_nftCollection).transferFrom(msg.sender, address(this), _tokenIds[i]);

            staker.stakedTokenIds.push(_tokenIds[i]);
            tokenIdToArrayIndex[_tokenIds[i]] = staker.stakedTokenIds.length - 1;
            stakerAddress[_tokenIds[i]] = msg.sender;

            (uint256 dust, Levels.Level level) = _getTokenProperties(_tokenIds[i]);
            uint256 dustPercentage = _getDustPercentage(level, _months);
            uint256 endTimestamp = _calculateEndTimeStamp(block.timestamp, _months);

            uint256 rewardAmount = _calculateReward(dust, dustPercentage);
            staker.votingPower += rewardAmount;
            staker.timeOfLastUpdate = block.timestamp;

            tokenIdToStakingCondition[_tokenIds[i]] = StakingCondition(
                _tokenIds[i],
                rewardAmount,
                block.timestamp,
                endTimestamp
            );
        }
    }

    function withdraw(uint256[] calldata _tokenIds) external nonReentrant {
        Staker storage staker = stakers[msg.sender];
        require(staker.stakedTokenIds.length > 0, "KS: You have no tokens staked");

        uint256 lenToWithdraw = _tokenIds.length;
        for (uint256 i; i < lenToWithdraw; ++i) {
            require(stakerAddress[_tokenIds[i]] == msg.sender, "KS: Different staker for token");

            uint256 index = tokenIdToArrayIndex[_tokenIds[i]];
            uint256 lastTokenIndex = staker.stakedTokenIds.length - 1;

            if (index != lastTokenIndex) {
                staker.stakedTokenIds[index] = staker.stakedTokenIds[lastTokenIndex];
                tokenIdToArrayIndex[staker.stakedTokenIds[index]] = index;
            }

            StakingCondition memory stakingCondition = tokenIdToStakingCondition[_tokenIds[i]];
            staker.stakedTokenIds.pop();
            staker.votingPower -= stakingCondition.rewardAmount;

            if (block.timestamp >= stakingCondition.endTimestamp) {
                staker.unclaimedRewards += stakingCondition.rewardAmount;
            }

            delete stakerAddress[_tokenIds[i]];
            delete tokenIdToStakingCondition[_tokenIds[i]];

            IERC721(_nftCollection).transferFrom(address(this), msg.sender, _tokenIds[i]);
        }
    }

    function claimRewards() external ifRewardsTokenSet {
        Staker storage staker = stakers[msg.sender];

        require(staker.unclaimedRewards > 0, "KS: No rewards to claim");
        staker.timeOfLastUpdate = block.timestamp;
        uint256 rewards = staker.unclaimedRewards;
        staker.unclaimedRewards = 0;

        IERC20(_rewardsToken).safeTransfer(msg.sender, rewards);
    }

    function _calculateReward(uint256 dust, uint256 dustPercentage)
        internal
        view
        returns (uint256)
    {
        return (((10 ^ rewardTokenDecimals) * dust) / dustPercentage) * 100;
    }

    function _calculateEndTimeStamp(uint256 startTimeStamp, uint256 months)
        internal
        pure
        returns (uint256)
    {
        return BASE_PERIOD * months + startTimeStamp;
    }

    function _getTokenProperties(uint256 tokenId)
        internal
        view
        returns (uint256 dust, Levels.Level level)
    {
        uint256 _dust = IKinetexRewards(_nftCollection).getDust(tokenId);
        Levels.Level _level = Levels.getLevelByDustAmount(dust);
        return (_dust, _level);
    }

    function _getDustPercentage(Levels.Level level, uint256 months)
        internal
        pure
        returns (uint256 dustPercentage)
    {
        if (level == Levels.Level.DUST) {
            if (months >= 12) {
                return 100;
            }
            if (months >= 6) {
                return 60;
            }
            if (months >= 3) {
                return 30;
            }
            if (months >= 1) {
                return 10;
            }

            return 0;
        }

        if (level == Levels.Level.GEM) {
            if (months >= 10) {
                return 100;
            }
            if (months >= 6) {
                return 60;
            }
            if (months >= 3) {
                return 40;
            }
            if (months >= 1) {
                return 20;
            }

            return 0;
        }

        if (level == Levels.Level.LIGHTNING) {
            if (months >= 8) {
                return 100;
            }
            if (months >= 6) {
                return 70;
            }
            if (months >= 3) {
                return 50;
            }
            if (months >= 1) {
                return 30;
            }

            return 0;
        }

        if (months >= 6) {
            return 100;
        }
        if (months >= 5) {
            return 80;
        }
        if (months >= 3) {
            return 60;
        }
        if (months >= 1) {
            return 40;
        }

        return 0;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
