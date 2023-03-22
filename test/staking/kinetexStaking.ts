import { expect } from "chai";
import { BigNumber } from "ethers";
import { getNamedAccounts, deployments, ethers } from "hardhat";
import { Level, mint } from "../../helpers";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import dayjs from "dayjs";

import type { KinetexRewards, KinetexStaking, MockERC20, MockERC20__factory } from "../../typechain";

describe("KinetexStaking tests", function () {
    let rewards: KinetexRewards;
    let staking: KinetexStaking;
    let rewardToken: MockERC20;

    const setupTest = deployments.createFixture(async ({ ethers }) => {
        await deployments.fixture();

        const rewardsDeployment = await deployments.get("KinetexRewards");
        rewards = (await ethers.getContractAt("KinetexRewards", rewardsDeployment.address)) as KinetexRewards;

        const stakingDeployment = await deployments.get("KinetexStaking");
        staking = (await ethers.getContractAt("KinetexStaking", stakingDeployment.address)) as KinetexStaking;

        const rewardTokenFactory: MockERC20__factory = await ethers.getContractFactory("MockERC20");
        rewardToken = (await rewardTokenFactory.deploy(staking.address)) as MockERC20;
    });

    this.beforeAll(async () => {
        await setupTest();
    });

    describe("Roles", () => {
        it("Deployer is the owner", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await staking.owner()).to.eq(deployer);
        });
    });

    describe("Staking: deposit and withdraw one token", () => {
        it("Can deposit a token", async () => {
            const args = await mint(rewards, "300");
            await rewards.approve(staking.address, args.tokenId);
            await expect(staking.stake([args.tokenId], BigNumber.from("3"))).not.to.be.reverted;
        });

        it("NFT voting power gets increased", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await staking.votingPower721(deployer)).not.to.eq(BigNumber.from("0"));
        });

        it("Condition is set for the deposited token", async () => {
            const tokenId = BigNumber.from("0");
            const condition = await staking.tokenIdToStakingCondition(tokenId);
            expect(condition.tokenId).to.eq(tokenId);
        });

        it("Token holder is the staking contract", async () => {
            expect(await rewards.ownerOf(BigNumber.from("0"))).to.eq(staking.address);
        });

        it("Can withdraw a token", async () => {
            const tokenId = BigNumber.from("0");
            await expect(staking.withdraw([tokenId])).not.to.be.reverted;
        });

        it("NFT voting power gets decreased", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(await staking.votingPower721(deployer)).to.eq(BigNumber.from("0"));
        });

        it("Token holder is the deployer", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await rewards.ownerOf(BigNumber.from("0"))).to.eq(deployer);
        });

        it("Can't claim rewards when there is no token set", async () => {
            await expect(staking.claimRewards()).to.be.revertedWith("KS: Reward token not set");
        });
    });

    describe("Staking: ERC20 rewards. Receive 100% (lightning, 2000, 6 months)", () => {
        const tokenId = BigNumber.from("1");

        it("Mints a LIGHTNING nft with 2000 dust", async () => {
            const args = await mint(rewards, "2000");
            await rewards.approve(staking.address, args.tokenId);
            expect(args.attributes.level).to.eq(Level.LIGHTNING);
        });

        it("Stakes it in the staking contract for 6 months", async () => {
            await rewards.approve(staking.address, tokenId);
            await expect(staking.stake([tokenId], BigNumber.from("6"))).not.to.be.reverted;
        });

        it("Has NFT voting power and reward amount of 2000 eth", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await staking.votingPower721(deployer)).to.eq(ethers.utils.parseEther("2000"));

            const condition = await staking.tokenIdToStakingCondition(tokenId);
            expect(condition.totalRewards).to.eq(ethers.utils.parseEther("2000"));
        });

        it("Sets the reward token", async () => {
            await expect(staking.setRewardsToken(rewardToken.address, BigNumber.from("18"))).not.to.be.reverted;
        });

        it("Network skips time by 6 months", async () => {
            const newTimeStamp = dayjs().add(180, "days").add(1, "minute").unix();
            await helpers.time.increaseTo(newTimeStamp);
            expect(await helpers.time.latest()).to.eq(newTimeStamp);
        });

        it("Staker's initial token balance is 0", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await rewardToken.balanceOf(deployer)).to.eq(BigNumber.from("0"));
        });

        it("Staker withdraws the token", async () => {
            const { deployer } = await getNamedAccounts();
            await expect(staking.withdraw([tokenId])).not.to.be.reverted;
            expect(await rewards.ownerOf(tokenId)).to.eq(deployer);
        });

        it("NFT voting power is 0", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await staking.votingPower721(deployer)).to.eq(BigNumber.from("0"));
        });

        it("Staker receives the 2000 dust (erc20) on claimRewards", async () => {
            // await expect(staking.claimRewards()).not.to.be.reverted;
            await staking.claimRewards();
            const { deployer } = await getNamedAccounts();
            expect(await rewardToken.balanceOf(deployer)).to.eq(ethers.utils.parseEther("2000"));
        });
    });

    describe("Staking: ERC20 rewards. Receive 50% (crystal, 200, 3 months)", () => {
        const tokenId = BigNumber.from("2");

        it("Drains deployers reward token balance for easier calc", async () => {
            const { deployer } = await getNamedAccounts();
            await rewardToken.transfer(staking.address, await rewardToken.balanceOf(deployer));
        });

        it("Mints a CRYSTAL nft with 200 dust", async () => {
            const args = await mint(rewards, "200");
            await rewards.approve(staking.address, args.tokenId);
            expect(args.attributes.level).to.eq(Level.CRYSTAL);
        });

        it("Stakes it in the staking contract for 3 months", async () => {
            await rewards.approve(staking.address, tokenId);
            await expect(staking.stake([tokenId], BigNumber.from("3"))).not.to.be.reverted;
        });

        it("Has NFT voting power and reward amount of 100 eth", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(await staking.votingPower721(deployer)).to.eq(ethers.utils.parseEther("100"));

            const condition = await staking.tokenIdToStakingCondition(tokenId);
            expect(condition.totalRewards).to.eq(ethers.utils.parseEther("100"));
        });

        it("Sets the reward token", async () => {
            await expect(staking.setRewardsToken(rewardToken.address, BigNumber.from("18"))).not.to.be.reverted;
        });

        it("Network skips time by 3 months", async () => {
            const prevTimestamp = await helpers.time.latest();
            const newTimestamp = dayjs.unix(prevTimestamp).add(90, "days").add(1, "minute").unix();
            await helpers.time.increaseTo(newTimestamp);
            expect(await helpers.time.latest()).to.eq(newTimestamp);
        });

        it("Staker's initial token balance is 0", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await rewardToken.balanceOf(deployer)).to.eq(BigNumber.from("0"));
        });

        it("Staker withdraws the token", async () => {
            const { deployer } = await getNamedAccounts();
            await expect(staking.withdraw([tokenId])).not.to.be.reverted;
            expect(await rewards.ownerOf(tokenId)).to.eq(deployer);
        });

        it("Staker receives the 100 dust (erc20)", async () => {
            // await expect(staking.claimRewards()).not.to.be.reverted;
            await staking.claimRewards();
            const { deployer } = await getNamedAccounts();
            expect(await rewardToken.balanceOf(deployer)).to.eq(ethers.utils.parseEther("100"));
        });
    });

    describe("Staking: ERC20 rewards. Stake for 8 months, claim in 3 months (crystal, 200), rest after 5 months", () => {
        const tokenId = BigNumber.from("3");

        it("Drains deployers reward token balance for easier calc", async () => {
            const { deployer } = await getNamedAccounts();
            await rewardToken.transfer(staking.address, await rewardToken.balanceOf(deployer));
        });

        it("Mints a CRYSTAL nft with 200 dust", async () => {
            const args = await mint(rewards, "200");
            await rewards.approve(staking.address, args.tokenId);
            expect(args.attributes.level).to.eq(Level.CRYSTAL);
        });

        it("Stakes it in the staking contract for 8 months", async () => {
            await rewards.approve(staking.address, tokenId);
            await expect(staking.stake([tokenId], BigNumber.from("8"))).not.to.be.reverted;
        });

        it("Has NFT voting power and reward amount of 200 eth", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(await staking.votingPower721(deployer)).to.eq(ethers.utils.parseEther("200"));

            const condition = await staking.tokenIdToStakingCondition(tokenId);
            expect(condition.totalRewards).to.eq(ethers.utils.parseEther("200"));
        });

        it("Sets the reward token", async () => {
            await expect(staking.setRewardsToken(rewardToken.address, BigNumber.from("18"))).not.to.be.reverted;
        });

        it("Network skips time by 3 months", async () => {
            const prevTimestamp = await helpers.time.latest();
            const newTimestamp = dayjs.unix(prevTimestamp).add(90, "days").add(1, "minute").unix();
            await helpers.time.increaseTo(newTimestamp);
            expect(await helpers.time.latest()).to.eq(newTimestamp);
        });

        it("Staker's initial token balance is 0", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await rewardToken.balanceOf(deployer)).to.eq(BigNumber.from("0"));
        });

        it("Staker receives the 50% (100 eth)", async () => {
            await expect(staking.claimRewards()).not.to.be.reverted;
            const { deployer } = await getNamedAccounts();
            expect(await rewardToken.balanceOf(deployer)).to.eq(ethers.utils.parseEther("100"));
        });

        it("Staker's NFT voting power gets decreased by 50%", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(await staking.votingPower721(deployer)).to.eq(ethers.utils.parseEther("100"));
        });

        it("Network skips time by 5 months", async () => {
            const prevTimestamp = await helpers.time.latest();
            const newTimestamp = dayjs
                .unix(prevTimestamp)
                .add(5 * 30, "days")
                .add(1, "minute")
                .unix();
            await helpers.time.increaseTo(newTimestamp);
            expect(await helpers.time.latest()).to.eq(newTimestamp);
        });

        it("Staker withdraws the token", async () => {
            const { deployer } = await getNamedAccounts();
            await expect(staking.withdraw([tokenId])).not.to.be.reverted;
            expect(await rewards.ownerOf(tokenId)).to.eq(deployer);
        });

        it("Staker receives the remaining 50% (100 eth), total balance is 200 eth", async () => {
            await expect(staking.claimRewards()).not.to.be.reverted;
            const { deployer } = await getNamedAccounts();
            expect(await rewardToken.balanceOf(deployer)).to.eq(ethers.utils.parseEther("200"));
        });

        it("Staker's NFT voting power is 0 (votes with received tokens)", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(await staking.votingPower721(deployer)).to.eq(BigNumber.from("0"));
        });
    });

    describe("Staking: deposit and withdraw multiple tokens", () => {
        let token1: BigNumber;
        let token2: BigNumber;

        it("Can deposit muiltiple tokens", async () => {
            const args1 = await mint(rewards, "300");
            const args2 = await mint(rewards, "3000");
            await rewards.approve(staking.address, args1.tokenId);
            await rewards.approve(staking.address, args2.tokenId);
            token1 = args1.tokenId;
            token2 = args2.tokenId;
            await expect(staking.stake([args1.tokenId, args2.tokenId], BigNumber.from("3"))).not.to.be.reverted;
        });

        it("NFT voting power gets increased", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(await staking.votingPower721(deployer)).not.to.eq(BigNumber.from("0"));
        });

        it("Condition is set for the deposited tokens", async () => {
            const condition = await staking.tokenIdToStakingCondition(token1);
            expect(condition.tokenId).to.eq(token1);
            const condition2 = await staking.tokenIdToStakingCondition(token2);
            expect(condition2.tokenId).to.eq(token2);
        });

        it("Tokens holder is the staking contract", async () => {
            expect(await rewards.ownerOf(token1)).to.eq(staking.address);
            expect(await rewards.ownerOf(token2)).to.eq(staking.address);
        });

        it("Can withdraw the tokens", async () => {
            await expect(staking.withdraw([token1, token2])).not.to.be.reverted;
        });

        it("NFT voting power gets decreased", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(await staking.votingPower721(deployer)).to.eq(BigNumber.from("0"));
        });

        it("Tokens holder is the deployer", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await rewards.ownerOf(token1)).to.eq(deployer);
            expect(await rewards.ownerOf(token2)).to.eq(deployer);
        });
    });

    describe("Staking: ERC20 multiple tokens. Receive 100% (lightning 2000, crystal 200, 8 months)", () => {
        let token1: BigNumber;
        let token2: BigNumber;

        it("Mints a LIGHTNING nft with 2000 dust, CRYSTAL with 200 dust", async () => {
            const args1 = await mint(rewards, "2000");
            await rewards.approve(staking.address, args1.tokenId);
            const args2 = await mint(rewards, "200");
            await rewards.approve(staking.address, args2.tokenId);
            token1 = args1.tokenId;
            token2 = args2.tokenId;
            expect(args1.attributes.level).to.eq(Level.LIGHTNING);
        });

        it("Stakes them in the staking contract for 8 months", async () => {
            await expect(staking.stake([token1, token2], BigNumber.from("8"))).not.to.be.reverted;
        });

        it("Has NFT voting power of 2200 eth", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(await staking.votingPower721(deployer)).to.eq(ethers.utils.parseEther("2200"));
        });

        it("Drains deployers reward token balance for easier calc", async () => {
            const { deployer } = await getNamedAccounts();
            await rewardToken.transfer(staking.address, await rewardToken.balanceOf(deployer));
        });

        it("Network skips time by 8 months", async () => {
            const prevTimestamp = await helpers.time.latest();
            const newTimestamp = dayjs
                .unix(prevTimestamp)
                .add(8 * 30, "days")
                .add(1, "minute")
                .unix();
            await helpers.time.increaseTo(newTimestamp);
            expect(await helpers.time.latest()).to.eq(newTimestamp);
        });

        it("Staker's initial token balance is 0", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await rewardToken.balanceOf(deployer)).to.eq(BigNumber.from("0"));
        });

        it("Staker withdraws the token", async () => {
            const { deployer } = await getNamedAccounts();
            await expect(staking.withdraw([token1, token2])).not.to.be.reverted;
            expect(await rewards.ownerOf(token1)).to.eq(deployer);
            expect(await rewards.ownerOf(token2)).to.eq(deployer);
        });

        it("NFT voting power gets decreased", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(await staking.votingPower721(deployer)).to.eq(BigNumber.from("0"));
        });

        it("Staker receives the 2200 dust (erc20) on claimRewards", async () => {
            await expect(staking.claimRewards()).not.to.be.reverted;
            const { deployer } = await getNamedAccounts();
            expect(await rewardToken.balanceOf(deployer)).to.eq(ethers.utils.parseEther("2200"));
        });
    });

    describe("Staking: ERC20 multiple tokens. Stake for 12 months, claim in 3 months (50% crystal 200, 40% gem 20), rest after 9 months", () => {
        let token1: BigNumber;
        let token2: BigNumber;

        it("Drains deployers reward token balance for easier calc", async () => {
            const { deployer } = await getNamedAccounts();
            await rewardToken.transfer(staking.address, await rewardToken.balanceOf(deployer));
        });

        it("Mints a crystal and a gem (200, 20)", async () => {
            const args1 = await mint(rewards, "200");
            const args2 = await mint(rewards, "20");
            token1 = args1.tokenId;
            token2 = args2.tokenId;
            await rewards.approve(staking.address, args1.tokenId);
            expect(args1.attributes.level).to.eq(Level.CRYSTAL);
            await rewards.approve(staking.address, args2.tokenId);
            expect(args2.attributes.level).to.eq(Level.GEM);
        });

        it("Stakes it in the staking contract for 8 months", async () => {
            await expect(staking.stake([token1, token2], BigNumber.from("12"))).not.to.be.reverted;
        });

        it("Has NFT voting power of 220 eth", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await staking.votingPower721(deployer)).to.eq(ethers.utils.parseEther("220"));
        });

        it("Network skips time by 3 months", async () => {
            const prevTimestamp = await helpers.time.latest();
            const newTimestamp = dayjs
                .unix(prevTimestamp)
                .add(3 * 30, "days")
                .add(1, "minute")
                .unix();
            await helpers.time.increaseTo(newTimestamp);
            expect(await helpers.time.latest()).to.eq(newTimestamp);
        });

        it("Staker's initial token balance is 0", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await rewardToken.balanceOf(deployer)).to.eq(BigNumber.from("0"));
        });

        it("Staker receives the 50% (100 eth) crystal, 40% (8 eth) gem", async () => {
            await expect(staking.claimRewards()).not.to.be.reverted;
            const { deployer } = await getNamedAccounts();
            expect(await rewardToken.balanceOf(deployer)).to.eq(ethers.utils.parseEther("108"));
        });

        it("Staker's NFT voting power is decreased", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await staking.votingPower721(deployer)).to.eq(ethers.utils.parseEther("112"));
        });

        it("Network skips time by 9 months", async () => {
            const prevTimestamp = await helpers.time.latest();
            const newTimestamp = dayjs
                .unix(prevTimestamp)
                .add(9 * 30, "days")
                .add(1, "minute")
                .unix();
            await helpers.time.increaseTo(newTimestamp);
            expect(await helpers.time.latest()).to.eq(newTimestamp);
        });

        it("Staker withdraws the tokens", async () => {
            const { deployer } = await getNamedAccounts();
            await expect(staking.withdraw([token1, token2])).not.to.be.reverted;
            expect(await rewards.ownerOf(token1)).to.eq(deployer);
            expect(await rewards.ownerOf(token2)).to.eq(deployer);
        });

        it("Staker receives the remaining 112 eth, total balance is 220 eth", async () => {
            await expect(staking.claimRewards()).not.to.be.reverted;
            const { deployer } = await getNamedAccounts();
            expect(await rewardToken.balanceOf(deployer)).to.eq(ethers.utils.parseEther("220"));
        });

        it("Staker's NFT voting power the same as token balance", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await staking.votingPower721(deployer)).to.eq(BigNumber.from("0"));
        });
    });
});
