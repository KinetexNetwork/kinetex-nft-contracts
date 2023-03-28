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

/**
 * @title                   Kinetex Staking
 * @author                  Kinetex Team
 * @notice                  Allows Kinetex Rewards holders stake their tokens to get access to Kinetex DAO.
 * @custom:security-contact semkin.eth@gmail.com
 **/
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
        uint256 claimedRewards;
    }

    struct StakingCondition {
        uint256 tokenId;
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 totalRewards;
        uint256 unclaimedRewards;
        uint256 claimedRewards;
    }

    uint256 private constant BASE_PERIOD = 30 days;
    uint256 private _rewardTokenDecimals;

    mapping(address => Staker) public stakers;
    mapping(uint256 => address) public stakerAddress;
    mapping(uint256 => uint256) public tokenIdToArrayIndex;
    mapping(uint256 => StakingCondition) public tokenIdToStakingCondition;

    event Stake(uint256[] tokenIds, address staker);
    event Withdraw(uint256[] tokenIds, address staker);

    uint256[98] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     *  @notice Modifier for functions that are only available when the rewards token is set.
     */
    modifier hasRewardToken() {
        require(_rewardsToken != address(0), "KS: Reward token not set");
        _;
    }

    /**
     *  @notice                 Initialize the contract and grant roles to the deployer
     *  @dev                    Reward token is not initialized, but decimals are needed for correct voting power calculations
     *  @param nftCollection    KinetexRewards deployed instance
     */
    function initialize(address nftCollection) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        _nftCollection = nftCollection;
        _rewardTokenDecimals = 18;
    }

    /**
     *  @notice             Stakes an array of tokenIds
     *  @dev                Periods are used to calculate the initial voting power for a staker.
     *  @param _tokenIds    TokenIds to stake
     *  @param _periods     How many periods a user wants to stake. Refer to BASE_PERIOD.
     */
    function stake(uint256[] calldata _tokenIds, uint256 _periods) external {
        Staker storage staker = stakers[msg.sender];

        if (staker.stakedTokenIds.length > 0) {
            _updateRewards(msg.sender);
        }

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

            uint256 endTimestamp = _calculateEndTimeStamp(block.timestamp, _periods);
            uint256 rewardAmount = _calculateReward(_tokenIds[i], _periods);

            staker.votingPower += rewardAmount;
            staker.timeOfLastUpdate = block.timestamp;

            tokenIdToStakingCondition[_tokenIds[i]] = StakingCondition(
                _tokenIds[i],
                block.timestamp,
                endTimestamp,
                rewardAmount,
                0,
                0
            );
        }

        emit Stake(_tokenIds, msg.sender);
    }

    /**
     *  @notice         Voting power calulation
     *  @dev            If the token exists, power received on market purchase of token is added
     *  @param account  Address to calculate the voting power for
     */
    function votingPower(address account) external view returns (uint256) {
        Staker memory staker = stakers[account];

        if (_rewardsToken == address(0)) {
            return staker.votingPower;
        }

        return (IERC20(_rewardsToken).balanceOf(account) + staker.votingPower);
    }

    /**
     *  @notice         Pure NFT voting power
     *  @dev            This function might be needed in the transition period when the rewardsToken is set
     */
    function votingPower721(address account) external view returns (uint256) {
        Staker memory staker = stakers[account];
        return staker.votingPower;
    }

    /**
     *  @notice             Withdraws the staked tokenIds
     *  @param _tokenIds    TokenIds to withdraw
     */
    function withdraw(uint256[] calldata _tokenIds) external nonReentrant {
        Staker storage staker = stakers[msg.sender];
        require(staker.stakedTokenIds.length > 0, "KS: You have no tokens staked");
        _updateRewards(msg.sender);

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
            staker.votingPower -= stakingCondition.totalRewards - stakingCondition.claimedRewards;

            delete stakerAddress[_tokenIds[i]];
            delete tokenIdToStakingCondition[_tokenIds[i]];

            IERC721(_nftCollection).transferFrom(address(this), msg.sender, _tokenIds[i]);
        }

        emit Withdraw(_tokenIds, msg.sender);
    }

    /**
     *  @notice             Sets the reward token
     *  @param _token       Address of the ERC20 token instance
     *  @param _decimals    Decimals of the token
     */
    function setRewardsToken(address _token, uint256 _decimals) external onlyOwner {
        _rewardsToken = _token;
        _rewardTokenDecimals = _decimals;
    }

    /**
     *  @notice If the rewards token is set, allows to claim accumulated rewards
     */
    function claimRewards() external hasRewardToken {
        Staker storage staker = stakers[msg.sender];

        _updateRewards(msg.sender);

        require(staker.unclaimedRewards > 0, "KS: No rewards to claim");

        uint256 rewards = staker.unclaimedRewards;

        staker.timeOfLastUpdate = block.timestamp;
        staker.unclaimedRewards = 0;
        staker.claimedRewards = rewards;

        uint256 len = staker.stakedTokenIds.length;
        if (len > 0) {
            uint256[] memory tokenIds = staker.stakedTokenIds;

            for (uint256 i; i < len; ++i) {
                StakingCondition storage stakingCondition = tokenIdToStakingCondition[tokenIds[i]];
                uint256 availableRewards = _availableRewards(stakingCondition, tokenIds[i]);
                stakingCondition.claimedRewards = availableRewards;
                staker.votingPower -= availableRewards;
            }
        }

        IERC20(_rewardsToken).safeTransfer(msg.sender, rewards);
    }

    /**
     *  @dev            Reward calculation triggered on a staker state update.
     *  @param _staker  Staker address
     */
    function _updateRewards(address _staker) internal {
        Staker storage staker = stakers[_staker];

        uint256 len = staker.stakedTokenIds.length;
        uint256[] memory tokenIds = staker.stakedTokenIds;
        uint256 totalRewards = 0;

        for (uint256 i; i < len; ++i) {
            StakingCondition storage stakingCondition = tokenIdToStakingCondition[tokenIds[i]];
            uint256 availableRewards = _availableRewards(stakingCondition, tokenIds[i]);
            stakingCondition.unclaimedRewards = availableRewards;
            totalRewards += availableRewards;
        }

        if (len > 0) {
            staker.unclaimedRewards = totalRewards;
            staker.timeOfLastUpdate = block.timestamp;
        }
    }

    /**
     *  @dev                     Calculates accumulated rewards in the current time
     *  @param stakingCondition  Staking configuration of the token
     *  @param tokenId           tokenId
     */
    function _availableRewards(StakingCondition memory stakingCondition, uint256 tokenId)
        internal
        view
        returns (uint256)
    {
        uint256 elapsedPeriods = _stakingPeriods(stakingCondition.startTimestamp, block.timestamp);
        return (_calculateReward(tokenId, elapsedPeriods) - stakingCondition.claimedRewards);
    }

    /**
     *  @dev                     Calculates accumulated rewards for a given amount of time
     *  @param _tokenId          tokenId
     *  @param _periods          Ellapsed periods. Refer to BASE_PERIOD
     */
    function _calculateReward(uint256 _tokenId, uint256 _periods) internal view returns (uint256) {
        (uint256 dust, Levels.Level level) = _getTokenProperties(_tokenId);
        uint256 dustPercentage = Levels._getDustPercentage(level, _periods);

        return (((10**_rewardTokenDecimals) * dust) * dustPercentage) / 100;
    }

    /**
     *  @dev                     Calculates the timestamp for the end of staking
     *  @param startTimeStamp    Unix timestamp of staking start
     *  @param periods           How many periods to stake for
     */
    function _calculateEndTimeStamp(uint256 startTimeStamp, uint256 periods)
        internal
        pure
        returns (uint256)
    {
        return BASE_PERIOD * periods + startTimeStamp;
    }

    /**
     *  @dev              Retrieves the onchain metadata for a given tokenId
     *  @param tokenId    tokenId
     */
    function _getTokenProperties(uint256 tokenId) internal view returns (uint256, Levels.Level) {
        uint256 _dust = IKinetexRewards(_nftCollection).getDust(tokenId);
        Levels.Level _level = Levels.getLevelByDustAmount(_dust);
        return (_dust, _level);
    }

    /**
     *  @dev                 Calculates the amount of staking periods between two dates
     *  @param _startDate    Start date Unix timestamp. Should be less than _endDate
     *  @param _endDate      Start date Unix timestamp. Should be greater than _startDate
     */
    function _stakingPeriods(uint256 _startDate, uint256 _endDate) internal pure returns (uint256) {
        return (_endDate - _startDate) / BASE_PERIOD;
    }

    /**
     *  @dev UUPS proxy upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
