import { expect } from "chai";
import { BigNumber } from "ethers";
import { getNamedAccounts, deployments, ethers } from "hardhat";
import { Level, MINTER_ROLE, BURNER_ROLE, mint, grantReward } from "../helpers";

import type { KinetexRewards } from "../typechain";

describe("KinetexRewards tests", function () {
    let rewards: KinetexRewards;

    const setupTest = deployments.createFixture(async ({ ethers, deployments }) => {
        await deployments.fixture("deployment");
        const rewardsDeployment = await deployments.get("KinetexRewards");
        rewards = (await ethers.getContractAt("KinetexRewards", rewardsDeployment.address)) as KinetexRewards;
    });

    this.beforeAll(async () => {
        await setupTest();
    });

    describe("Roles", () => {
        it("Deployer has MINTER role", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await rewards.hasRole(MINTER_ROLE, deployer)).to.eq(true);
        });

        it("Deployer has BURNER role", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await rewards.hasRole(BURNER_ROLE, deployer)).to.eq(true);
        });
    });

    describe("Issuer", () => {
        let signature: string = "init signature";
        it("Can't mint with a random signature", async () => {
            const { tester } = await getNamedAccounts();
            await expect(rewards.safeMint(tester, BigNumber.from("300"), BigNumber.from("0"), signature)).to.be
                .reverted;
        });

        it("A random EOA can mint with issuer's signature", async () => {
            const { tester } = await getNamedAccounts();
            signature = await grantReward(tester, "300", "0");
            expect(await rewards.safeMint(tester, BigNumber.from("300"), BigNumber.from("300"), signature))
                .to.emit(rewards, "Mint")
                .withArgs(0, { level: Level.DUST, dust: BigNumber.from("300") });
        });

        it("Can't use the signature twice", async () => {
            const { tester } = await getNamedAccounts();
            await expect(rewards.safeMint(tester, BigNumber.from("300"), BigNumber.from("300"), signature)).to.be
                .reverted;
        });
    });

    describe("Minting", () => {
        it("Mints NFTs", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await rewards.safeMintPriveleged(deployer, BigNumber.from("33")))
                .to.emit(rewards, "Mint")
                .withArgs(0, { level: Level.DUST, dust: BigNumber.from("33") });
        });

        it("Mints DUST token", async () => {
            const { deployer } = await getNamedAccounts();
            const dust = BigNumber.from("3");
            const tx = await rewards.safeMintPriveleged(deployer, dust);
            const receipt = await tx.wait(1);
            const args = receipt.events?.filter((el) => el.event === "Mint")[0].args!;
            expect(args.attributes.level).to.eq(Level.DUST);
            expect(args.attributes.dust).to.eq(dust);
        });

        it("Mints GEM token", async () => {
            const { deployer } = await getNamedAccounts();
            const dust = BigNumber.from("33");
            const tx = await rewards.safeMintPriveleged(deployer, dust);
            const receipt = await tx.wait(1);
            const args = receipt.events?.filter((el) => el.event === "Mint")[0].args!;
            expect(args.attributes.level).to.eq(Level.GEM);
            expect(args.attributes.dust).to.eq(dust);
        });

        it("Mints CRYSTAL token", async () => {
            const { deployer } = await getNamedAccounts();
            const dust = BigNumber.from("333");
            const tx = await rewards.safeMintPriveleged(deployer, dust);
            const receipt = await tx.wait(1);
            const args = receipt.events?.filter((el) => el.event === "Mint")[0].args!;
            expect(args.attributes.level).to.eq(Level.CRYSTAL);
            expect(args.attributes.dust).to.eq(dust);
        });

        it("Mints LIGHTNING token", async () => {
            const { deployer } = await getNamedAccounts();
            const dust = BigNumber.from("3333");
            const tx = await rewards.safeMintPriveleged(deployer, dust);
            const receipt = await tx.wait(1);
            const args = receipt.events?.filter((el) => el.event === "Mint")[0].args!;
            expect(args.attributes.level).to.eq(Level.LIGHTNING);
            expect(args.attributes.dust).to.eq(dust);
        });
    });

    describe("Security", () => {
        it("Only owner of an NFT can burn it", async () => {
            const { deployer, tester } = await getNamedAccounts();
            const { tokenId } = await mint(rewards, "33");

            const testerSigner = await ethers.getSigner(tester);
            await expect(rewards.connect(testerSigner).burn(tokenId)).to.be.revertedWith(
                "ERC721: caller is not token owner or approved"
            );

            const deployerSigner = await ethers.getSigner(deployer);
            expect(await rewards.connect(deployerSigner).burn(tokenId))
                .to.emit(rewards, "Burn")
                .withArgs(tokenId);
        });
    });
});
