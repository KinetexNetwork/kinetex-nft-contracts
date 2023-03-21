import { expect } from "chai";
import { BigNumber } from "ethers";
import { getNamedAccounts, deployments } from "hardhat";
import { mint } from "../../helpers";

import type { KinetexRewards, KinetexStaking } from "../../typechain";

describe("KinetexStaking tests", function () {
    let rewards: KinetexRewards;
    let staking: KinetexStaking;

    const setupTest = deployments.createFixture(async ({ ethers }) => {
        await deployments.fixture();

        const rewardsDeployment = await deployments.get("KinetexRewards");
        rewards = (await ethers.getContractAt("KinetexRewards", rewardsDeployment.address)) as KinetexRewards;

        const stakingDeployment = await deployments.get("KinetexStaking");
        staking = (await ethers.getContractAt("KinetexStaking", stakingDeployment.address)) as KinetexStaking;
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
});
