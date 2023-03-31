import { expect } from "chai";
import { BigNumber } from "ethers";
import { getNamedAccounts, deployments, ethers } from "hardhat";
import { mint, grantReward, forceLocked, forceUnlocked, sigMint } from "../../helpers";

import type { KinetexRewards } from "../../typechain";

describe("KinetexRewards soulbound logic tests", function () {
    let rewards: KinetexRewards;

    const setupTest = deployments.createFixture(async ({ ethers, deployments }) => {
        await deployments.fixture("deployment");
        const rewardsDeployment = await deployments.get("KinetexRewards");
        rewards = (await ethers.getContractAt("KinetexRewards", rewardsDeployment.address)) as KinetexRewards;
    });

    this.beforeAll(async () => {
        await setupTest();
    });

    describe("Soulbound: Transfers", () => {
        let tokenId: BigNumber;

        it("transferFrom is reverted", async () => {
            await forceLocked(rewards);
            const { deployer, tester } = await getNamedAccounts();
            const args = await mint(rewards, "30");
            tokenId = args.tokenId;
            await expect(rewards.transferFrom(deployer, tester, tokenId)).to.be.revertedWith(
                "KR: Tokens are soulbound"
            );
        });

        it("safeTransferFrom is not reverted", async () => {
            const { deployer, tester } = await getNamedAccounts();
            const args = await mint(rewards, "30");
            tokenId = args.tokenId;
            await expect(
                rewards["safeTransferFrom(address,address,uint256)"](deployer, tester, tokenId)
            ).to.be.revertedWith("KR: Tokens are soulbound");
        });

        it("safeTransferFrom override is not reverted", async () => {
            const { deployer, tester } = await getNamedAccounts();
            const args = await mint(rewards, "30");
            tokenId = args.tokenId;
            await expect(
                rewards["safeTransferFrom(address,address,uint256,bytes)"](
                    deployer,
                    tester,
                    tokenId,
                    ethers.utils.toUtf8Bytes("")
                )
            ).to.be.revertedWith("KR: Tokens are soulbound");
        });
    });

    describe("Unlocked: Transfers", () => {
        let tokenId: BigNumber;

        it("transferFrom is not reverted", async () => {
            await forceUnlocked(rewards);
            const { deployer, tester } = await getNamedAccounts();
            const args = await mint(rewards, "30");
            tokenId = args.tokenId;
            expect(await rewards.transferFrom(deployer, tester, tokenId)).to.emit(rewards, "Transfer");
        });

        it("safeTransferFrom is reverted", async () => {
            const { deployer, tester } = await getNamedAccounts();
            const args = await mint(rewards, "30");
            tokenId = args.tokenId;
            expect(await rewards["safeTransferFrom(address,address,uint256)"](deployer, tester, tokenId)).to.emit(
                rewards,
                "Transfer"
            );
        });

        it("safeTransferFrom override is reverted", async () => {
            const { deployer, tester } = await getNamedAccounts();
            const args = await mint(rewards, "30");
            tokenId = args.tokenId;
            expect(
                await rewards["safeTransferFrom(address,address,uint256,bytes)"](
                    deployer,
                    tester,
                    tokenId,
                    ethers.utils.toUtf8Bytes("")
                )
            ).to.emit(rewards, "Transfer");
        });
    });

    describe("Soulbound: Burn", () => {
        let tokenId: BigNumber;

        it("burn is reverted", async () => {
            await forceLocked(rewards);
            const { tester } = await getNamedAccounts();
            const sig = await grantReward(tester, "30", "0");
            const args = await sigMint(rewards, tester, "30", "0", sig);
            const signer = await ethers.getSigner(tester);
            tokenId = args.tokenId;
            await expect(rewards.connect(signer).burn(args.tokenId)).to.be.revertedWith("KR: Tokens are soulbound");
        });
    });

    describe("Unlocked: Burn", () => {
        let tokenId: BigNumber;

        it("burn is reverted", async () => {
            await forceUnlocked(rewards);
            const { tester } = await getNamedAccounts();
            const sig = await grantReward(tester, "30", "1");
            const args = await sigMint(rewards, tester, "30", "1", sig);
            const signer = await ethers.getSigner(tester);
            tokenId = args.tokenId;
            expect(await rewards.connect(signer).burn(args.tokenId)).to.emit(rewards, "Burn");
        });
    });
});
