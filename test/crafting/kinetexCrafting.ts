import { expect } from "chai";
import { BigNumber } from "ethers";
import { getNamedAccounts, deployments } from "hardhat";
import { Level, encodeSolityKeccak } from "../../helpers";

import type {
    KinetexCrafting,
    KinetexCrafting__factory,
    KinetexRewards,
    KinetexRewards__factory,
} from "../../typechain";

describe("KinetexCrafting tests", function () {
    let rewards: KinetexRewards;
    let crafting: KinetexCrafting;
    const minterRole = encodeSolityKeccak("MINTER_ROLE");
    const burnerRole = encodeSolityKeccak("BURNER_ROLE");

    const setupTest = deployments.createFixture(async ({ ethers, upgrades }) => {
        const rewardsFactory: KinetexRewards__factory = await ethers.getContractFactory("KinetexRewards");
        rewards = (await upgrades.deployProxy(rewardsFactory)) as KinetexRewards;
        await rewards.deployed();

        const craftingFactory: KinetexCrafting__factory = await ethers.getContractFactory("KinetexCrafting");
        crafting = (await upgrades.deployProxy(craftingFactory, [rewards.address])) as KinetexCrafting;
        await crafting.deployed();

        await rewards.grantRole(minterRole, crafting.address);
        await rewards.grantRole(burnerRole, crafting.address);
    });

    this.beforeAll(async () => {
        await setupTest();
    });

    describe("Roles", () => {
        it("Has MINTER role", async () => {
            expect(await rewards.hasRole(minterRole, crafting.address)).to.eq(true);
        });

        it("Has BURNER role", async () => {
            expect(await rewards.hasRole(burnerRole, crafting.address)).to.eq(true);
        });
    });

    describe("Crafting", () => {
        it("Receives a DUST lvl nft with 4 dust", async () => {
            const { deployer } = await getNamedAccounts();
            // mint a DUST token with 4 dust
            const tx1 = await rewards.safeMint(deployer, BigNumber.from("4"));
            const receipt1 = await tx1.wait(1);
            const args1 = receipt1.events?.filter((el) => el.event === "Mint")[0].args!;
            const tokenA = args1.tokenId;
            expect(args1.attributes.level).to.eq(Level.DUST);
            expect(await rewards.ownerOf(tokenA)).to.eq(deployer);
        });

        it("Receives a DUST lvl nft with 7 dust", async () => {
            const { deployer } = await getNamedAccounts();
            const tx2 = await rewards.safeMint(deployer, BigNumber.from("7"));
            const receipt2 = await tx2.wait(1);
            const args2 = receipt2.events?.filter((el) => el.event === "Mint")[0].args!;
            const tokenB = args2.tokenId;
            expect(args2.attributes.level).to.eq(Level.DUST);

            expect(await rewards.ownerOf(tokenB)).to.eq(deployer);
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
});
