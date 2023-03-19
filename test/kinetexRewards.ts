import { expect } from "chai";
import { BigNumber } from "ethers";
import { getNamedAccounts, deployments } from "hardhat";
import { Level, MINTER_ROLE, BURNER_ROLE } from "../helpers";

import type { KinetexRewards } from "../typechain";

describe("KinetexRewards tests", function () {
    let rewards: KinetexRewards;

    const setupTest = deployments.createFixture(async ({ ethers, deployments }) => {
        await deployments.fixture();
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

    describe("Minting", () => {
        it("Mints NFTs", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await rewards.safeMint(deployer, BigNumber.from("33")))
                .to.emit(rewards, "Mint")
                .withArgs(0, { level: Level.DUST, dust: BigNumber.from("33") });
        });

        it("Mints DUST token", async () => {
            const { deployer } = await getNamedAccounts();
            const dust = BigNumber.from("3");
            const tx = await rewards.safeMint(deployer, dust);
            const receipt = await tx.wait(1);
            const args = receipt.events?.filter((el) => el.event === "Mint")[0].args!;
            expect(args.attributes.level).to.eq(Level.DUST);
            expect(args.attributes.dust).to.eq(dust);
        });

        it("Mints GEM token", async () => {
            const { deployer } = await getNamedAccounts();
            const dust = BigNumber.from("33");
            const tx = await rewards.safeMint(deployer, dust);
            const receipt = await tx.wait(1);
            const args = receipt.events?.filter((el) => el.event === "Mint")[0].args!;
            expect(args.attributes.level).to.eq(Level.GEM);
            expect(args.attributes.dust).to.eq(dust);
        });

        it("Mints CRYSTAL token", async () => {
            const { deployer } = await getNamedAccounts();
            const dust = BigNumber.from("333");
            const tx = await rewards.safeMint(deployer, dust);
            const receipt = await tx.wait(1);
            const args = receipt.events?.filter((el) => el.event === "Mint")[0].args!;
            expect(args.attributes.level).to.eq(Level.CRYSTAL);
            expect(args.attributes.dust).to.eq(dust);
        });

        it("Mints LIGHTNING token", async () => {
            const { deployer } = await getNamedAccounts();
            const dust = BigNumber.from("3333");
            const tx = await rewards.safeMint(deployer, dust);
            const receipt = await tx.wait(1);
            const args = receipt.events?.filter((el) => el.event === "Mint")[0].args!;
            expect(args.attributes.level).to.eq(Level.LIGHTNING);
            expect(args.attributes.dust).to.eq(dust);
        });
    });
});
