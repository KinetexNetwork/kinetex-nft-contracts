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

    describe("Staking: deposit and withdraw", () => {
        it("Can deposit a token", async () => {
            const args = await mint(rewards, "300");
            await rewards.approve(staking.address, args.tokenId);
            await expect(staking.stake([args.tokenId], BigNumber.from("3"))).not.to.be.reverted;
        });

        it("Voting power gets increased", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(staker.votingPower).not.to.eq(BigNumber.from("0"));
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

        it("Voting power gets decreased", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(staker.votingPower).to.eq(BigNumber.from("0"));
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

        it("Has voting power and reward amount of 2000 eth", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(staker.votingPower).to.eq(ethers.utils.parseEther("2000"));

            const condition = await staking.tokenIdToStakingCondition(tokenId);
            expect(condition.rewardAmount).to.eq(ethers.utils.parseEther("2000"));
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

        it("Voting power gets decreased", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(staker.votingPower).to.eq(BigNumber.from("0"));
        });

        it("Staker receives the 2000 dust (erc20) on claimRewards", async () => {
            await expect(staking.claimRewards()).not.to.be.reverted;
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

        it("Has voting power and reward amount of 100 eth", async () => {
            const { deployer } = await getNamedAccounts();
            const staker = await staking.stakers(deployer);
            expect(staker.votingPower).to.eq(ethers.utils.parseEther("100"));

            const condition = await staking.tokenIdToStakingCondition(tokenId);
            expect(condition.rewardAmount).to.eq(ethers.utils.parseEther("100"));
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
            await expect(staking.claimRewards()).not.to.be.reverted;
            const { deployer } = await getNamedAccounts();
            expect(await rewardToken.balanceOf(deployer)).to.eq(ethers.utils.parseEther("100"));
        });
    });
});
