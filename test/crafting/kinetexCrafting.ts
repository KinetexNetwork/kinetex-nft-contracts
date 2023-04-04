import { expect } from "chai";
import { BigNumber } from "ethers";
import { getNamedAccounts, deployments } from "hardhat";
import { BURNER_ROLE, forceLocked, forceUnlocked, Level, mint, MINTER_ROLE } from "../../helpers";
import { ethers } from "hardhat";

import type { KinetexCrafting, KinetexRewards } from "../../typechain";

describe("KinetexCrafting tests", function () {
    let rewards: KinetexRewards;
    let crafting: KinetexCrafting;

    const setupTest = deployments.createFixture(async ({ ethers }) => {
        await deployments.fixture("deployment");

        const rewardsDeployment = await deployments.get("KinetexRewards");
        rewards = (await ethers.getContractAt("KinetexRewards", rewardsDeployment.address)) as KinetexRewards;

        const craftingDeployment = await deployments.get("KinetexCrafting");
        crafting = (await ethers.getContractAt("KinetexCrafting", craftingDeployment.address)) as KinetexCrafting;

        await forceUnlocked(rewards);
    });

    this.beforeAll(async () => {
        await setupTest();
    });

    describe("Roles", () => {
        it("Has MINTER role", async () => {
            expect(await rewards.hasRole(MINTER_ROLE, crafting.address)).to.eq(true);
        });

        it("Has BURNER role", async () => {
            expect(await rewards.hasRole(BURNER_ROLE, crafting.address)).to.eq(true);
        });
    });

    describe("Crafting logic", () => {
        describe("Crafts a GEM", () => {
            it("Receives a DUST lvl nft with 2000 dust", async () => {
                await forceUnlocked(rewards);
                const { deployer } = await getNamedAccounts();
                const args = await mint(rewards, "2000");
                expect(args.attributes.level).to.eq(Level.DUST);
                expect(await rewards.ownerOf(args.tokenId)).to.eq(deployer);
            });

            it("Receives a DUST lvl nft with 2000 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const args = await mint(rewards, "2000");
                expect(args.attributes.level).to.eq(Level.DUST);
                expect(await rewards.ownerOf(args.tokenId)).to.eq(deployer);
            });

            it("Creates a GEM lvl nft with 4000 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const tokenA = BigNumber.from("0");
                const tokenB = BigNumber.from("1");

                // combine
                await rewards.approve(crafting.address, tokenA);
                await rewards.approve(crafting.address, tokenB);
                const tx3 = await crafting.craft(tokenA, tokenB);
                const receipt3 = await tx3.wait(1);
                const args3 = receipt3.events?.filter((el) => el.event === "Craft")[0].args!;
                const tokenId = args3.tokenId;

                // deployer now has 1 nft
                expect(await rewards.balanceOf(deployer)).to.eq(BigNumber.from("1"));
                expect(await rewards.ownerOf(tokenId)).to.eq(deployer);
                expect((await rewards.getAttributes(tokenId)).dust).to.eq(BigNumber.from("4000"));
            });

            it("Burns received DUST nfts", async () => {
                const tokenA = BigNumber.from("0");
                const tokenB = BigNumber.from("1");
                // previous tokens don't exist
                await expect(rewards.ownerOf(tokenA)).to.be.reverted;
                await expect(rewards.ownerOf(tokenB)).to.be.reverted;
            });
        });

        describe("Crafts a CRYSTAL", () => {
            it("Receives a GEM lvl nft with 4000 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const args = await mint(rewards, "4000");
                expect(args.attributes.level).to.eq(Level.GEM);
                expect(await rewards.ownerOf(args.tokenId)).to.eq(deployer);
            });

            it("Receives a GEM lvl nft with 4000 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const args = await mint(rewards, "4000");
                expect(args.attributes.level).to.eq(Level.GEM);
                expect(await rewards.ownerOf(args.tokenId)).to.eq(deployer);
            });

            it("Creates a CRYSTAL lvl nft with 8000 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const tokenA = BigNumber.from("3");
                const tokenB = BigNumber.from("4");

                // combine
                await rewards.approve(crafting.address, tokenA);
                await rewards.approve(crafting.address, tokenB);
                const tx3 = await crafting.craft(tokenA, tokenB);
                const receipt3 = await tx3.wait(1);
                const args3 = receipt3.events?.filter((el) => el.event === "Craft")[0].args!;
                const tokenId = args3.tokenId;

                expect(await rewards.ownerOf(tokenId)).to.eq(deployer);
                expect((await rewards.getAttributes(tokenId)).dust).to.eq(BigNumber.from("8000"));
            });
        });

        describe("Crafts a LIGHTNING", () => {
            it("Receives a CRYSTAL lvl nft with 6000 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const args = await mint(rewards, "6000");
                expect(args.attributes.level).to.eq(Level.CRYSTAL);
                expect(await rewards.ownerOf(args.tokenId)).to.eq(deployer);
            });

            it("Receives a CRYSTAL lvl nft with 6000 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const args = await mint(rewards, "6000");
                expect(args.attributes.level).to.eq(Level.CRYSTAL);
                expect(await rewards.ownerOf(args.tokenId)).to.eq(deployer);
            });

            it("Creates a LIGHTNING lvl nft with 12000 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const tokenA = BigNumber.from("6");
                const tokenB = BigNumber.from("7");

                // combine
                await rewards.approve(crafting.address, tokenA);
                await rewards.approve(crafting.address, tokenB);
                const tx3 = await crafting.craft(tokenA, tokenB);
                const receipt3 = await tx3.wait(1);
                const args3 = receipt3.events?.filter((el) => el.event === "Craft")[0].args!;
                const tokenId = args3.tokenId;

                expect(await rewards.ownerOf(tokenId)).to.eq(deployer);
                expect((await rewards.getAttributes(tokenId)).dust).to.eq(BigNumber.from("12000"));
            });
        });
    });

    describe("Security", () => {
        it("Can't craft without approval", async () => {
            const { deployer } = await getNamedAccounts();

            const args1 = await mint(rewards, "4");
            const args2 = await mint(rewards, "7");
            expect(await rewards.ownerOf(args1.tokenId)).to.eq(deployer);

            await expect(crafting.craft(args1.tokenId, args2.tokenId)).to.be.revertedWith(
                "ERC721: caller is not token owner or approved"
            );
        });

        it("Only owner of the NFTs can craft them", async () => {
            const { deployer, tester } = await getNamedAccounts();

            const args1 = await mint(rewards, "4");
            const args2 = await mint(rewards, "7");
            await rewards.approve(crafting.address, args1.tokenId);
            await rewards.approve(crafting.address, args2.tokenId);
            expect(await rewards.ownerOf(args1.tokenId)).to.eq(deployer);

            const testerSigner = await ethers.getSigner(tester);
            await expect(crafting.connect(testerSigner).craft(args1.tokenId, args2.tokenId)).to.be.revertedWith(
                "KC: Not the owner of tokenA"
            );
        });
    });

    describe("Soulbound", () => {
        it("Can't craft when KinetexRewards is Soulbound", async () => {
            await forceLocked(rewards);
            const args1 = await mint(rewards, "1000");
            expect(args1.attributes.level).to.eq(Level.DUST);
            const args2 = await mint(rewards, "2000");
            expect(args2.attributes.level).to.eq(Level.DUST);
            await expect(crafting.craft(args1.tokenId, args2.tokenId)).to.be.reverted;
        });
    });
});
