import { expect } from "chai";
import { BigNumber } from "ethers";
import { getNamedAccounts, deployments, ethers } from "hardhat";
import { MINTER_ROLE, BURNER_ROLE, grantReward, forceUnlocked } from "../../helpers";

import type { KinetexAmbassador, KinetexRewards } from "../../typechain";

describe("KinetexAmbassador tests", function () {
    let ambassador: KinetexAmbassador;
    let rewards: KinetexRewards;

    const setupTest = deployments.createFixture(async ({ ethers, deployments }) => {
        await deployments.fixture("deployment");

        const ambassadorDeployment = await deployments.get("KinetexAmbassador");
        ambassador = (await ethers.getContractAt(
            "KinetexAmbassador",
            ambassadorDeployment.address
        )) as KinetexAmbassador;

        const rewardsDeployment = await deployments.get("KinetexRewards");
        rewards = (await ethers.getContractAt("KinetexRewards", rewardsDeployment.address)) as KinetexRewards;

        await forceUnlocked(rewards);
    });

    this.beforeAll(async () => {
        await setupTest();
    });

    describe("Roles", () => {
        it("Deployer has MINTER role", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await ambassador.hasRole(MINTER_ROLE, deployer)).to.eq(true);
        });

        it("Deployer has BURNER role", async () => {
            const { deployer } = await getNamedAccounts();
            expect(await ambassador.hasRole(BURNER_ROLE, deployer)).to.eq(true);
        });
    });

    describe("Signature Mint", () => {
        let signature: string = "init signature";
        it("Can't mint with a random signature", async () => {
            const { tester } = await getNamedAccounts();
            await expect(ambassador.safeMint(tester, BigNumber.from("0"), BigNumber.from("0"), signature)).to.be
                .reverted;
        });

        it("A random EOA can mint with issuer's signature", async () => {
            const { tester } = await getNamedAccounts();
            const testerSigner = await ethers.getSigner(tester);
            signature = await grantReward(tester, "0", "0");
            expect(
                await ambassador
                    .connect(testerSigner)
                    .safeMint(tester, BigNumber.from("0"), BigNumber.from("0"), signature)
            )
                .to.emit(ambassador, "Mint")
                .withArgs(0, BigNumber.from("0"));
        });

        it("Can't use the signature twice", async () => {
            const { tester } = await getNamedAccounts();
            await expect(ambassador.safeMint(tester, BigNumber.from("0"), BigNumber.from("0"), signature)).to.be
                .reverted;
        });
    });

    describe("Burn", () => {
        it("A reward is granted on burn", async () => {
            const { tester } = await getNamedAccounts();
            const testerSigner = await ethers.getSigner(tester);
            const signature = await grantReward(tester, "0", "1");

            expect(
                await ambassador
                    .connect(testerSigner)
                    .safeMint(tester, BigNumber.from("0"), BigNumber.from("1"), signature)
            )
                .to.emit(ambassador, "Mint")
                .withArgs(0, BigNumber.from("0"));

            expect(await ambassador.connect(testerSigner).burn(BigNumber.from("0"))).to.emit(rewards, "Mint");
        });
    });
});
