import type { DeployFunction } from "hardhat-deploy/types";
import type { KinetexCrafting, KinetexCrafting__factory, KinetexRewards } from "../typechain";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
import { BURNER_ROLE, MINTER_ROLE } from "../helpers/roles";

const func: DeployFunction = async function ({ ethers, upgrades, deployments }: HardhatRuntimeEnvironment) {
    const rewardsDeployment = await deployments.get("KinetexRewards");
    const rewards = (await ethers.getContractAt("KinetexRewards", rewardsDeployment.address)) as KinetexRewards;

    const craftingFactory: KinetexCrafting__factory = await ethers.getContractFactory("KinetexCrafting");
    const crafting = (await upgrades.deployProxy(craftingFactory, [rewardsDeployment.address])) as KinetexCrafting;
    await crafting.deployed();

    const artifact = await deployments.getExtendedArtifact("KinetexCrafting");
    const deployment = {
        address: crafting.address,
        ...artifact,
    };

    await rewards.grantRole(MINTER_ROLE, crafting.address);
    await rewards.grantRole(BURNER_ROLE, crafting.address);

    await deployments.save("KinetexCrafting", deployment);
};

export default func;
func.tags = ["Crafting"];
