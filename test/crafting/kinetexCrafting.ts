import { expect } from "chai";
import { BigNumber } from "ethers";
import { getNamedAccounts, deployments } from "hardhat";
import { BURNER_ROLE, Level, mint, MINTER_ROLE } from "../../helpers";
import { ethers } from "hardhat";

import type { KinetexCrafting, KinetexRewards } from "../../typechain";

describe("KinetexCrafting tests", function () {
    let rewards: KinetexRewards;
    let crafting: KinetexCrafting;

    const setupTest = deployments.createFixture(async ({ ethers, upgrades }) => {
        await deployments.fixture("deployment");

        const rewardsDeployment = await deployments.get("KinetexRewards");
        rewards = (await ethers.getContractAt("KinetexRewards", rewardsDeployment.address)) as KinetexRewards;

        const craftingDeployment = await deployments.get("KinetexCrafting");
        crafting = (await ethers.getContractAt("KinetexCrafting", craftingDeployment.address)) as KinetexCrafting;
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
            it("Receives a DUST lvl nft with 4 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const args = await mint(rewards, "4");
                expect(args.attributes.level).to.eq(Level.DUST);
                expect(await rewards.ownerOf(args.tokenId)).to.eq(deployer);
            });

            it("Receives a DUST lvl nft with 7 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const args = await mint(rewards, "7");
                expect(args.attributes.level).to.eq(Level.DUST);
                expect(await rewards.ownerOf(args.tokenId)).to.eq(deployer);
            });

            it("Creates a GEM lvl nft with 11 dust", async () => {
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
                expect(await rewards.getDust(tokenId)).to.eq(BigNumber.from("11"));
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
            it("Receives a GEM lvl nft with 44 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const args = await mint(rewards, "44");
                expect(args.attributes.level).to.eq(Level.GEM);
                expect(await rewards.ownerOf(args.tokenId)).to.eq(deployer);
            });

            it("Receives a GEM lvl nft with 77 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const args = await mint(rewards, "77");
                expect(args.attributes.level).to.eq(Level.GEM);
                expect(await rewards.ownerOf(args.tokenId)).to.eq(deployer);
            });

            it("Creates a CRYSTAL lvl nft with 121 dust", async () => {
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
                expect(await rewards.getDust(tokenId)).to.eq(BigNumber.from("121"));
            });
        });

        describe("Crafts a LIGHTNING", () => {
            it("Receives a CRYSTAL lvl nft with 444 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const args = await mint(rewards, "444");
                expect(args.attributes.level).to.eq(Level.CRYSTAL);
                expect(await rewards.ownerOf(args.tokenId)).to.eq(deployer);
            });

            it("Receives a CRYSTAL lvl nft with 777 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const args = await mint(rewards, "777");
                expect(args.attributes.level).to.eq(Level.CRYSTAL);
                expect(await rewards.ownerOf(args.tokenId)).to.eq(deployer);
            });

            it("Creates a LIGHTNING lvl nft with 1221 dust", async () => {
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
                expect(await rewards.getDust(tokenId)).to.eq(BigNumber.from("1221"));
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
});
