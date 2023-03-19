import { expect } from "chai";
import { BigNumber } from "ethers";
import { Result } from "ethers/lib/utils";
import { getNamedAccounts, deployments } from "hardhat";
import { BURNER_ROLE, Level, MINTER_ROLE } from "../../helpers";

import type {
    KinetexCrafting,
    KinetexCrafting__factory,
    KinetexRewards,
    KinetexRewards__factory,
} from "../../typechain";

describe("KinetexCrafting tests", function () {
    let rewards: KinetexRewards;
    let crafting: KinetexCrafting;

    const mintAndGetAttributes = async (dustAmt: string): Promise<Result> => {
        const { deployer } = await getNamedAccounts();
        const tx = await rewards.safeMint(deployer, BigNumber.from(dustAmt));
        const receipt = await tx.wait(1);
        const args = receipt.events?.filter((el) => el.event === "Mint")[0].args!;
        return args;
    };

    const setupTest = deployments.createFixture(async ({ ethers, upgrades }) => {
        await deployments.fixture();

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

    describe("Crafting", () => {
        describe("4 dust DUST nft + 7 dust DUST nft = 11 dust GEM nft", () => {
            it("Receives a DUST lvl nft with 4 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const args = await mintAndGetAttributes("4");
                expect(args.attributes.level).to.eq(Level.DUST);
                expect(await rewards.ownerOf(args.tokenId)).to.eq(deployer);
            });

            it("Receives a DUST lvl nft with 7 dust", async () => {
                const { deployer } = await getNamedAccounts();
                const args = await mintAndGetAttributes("7");
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
    });
});
