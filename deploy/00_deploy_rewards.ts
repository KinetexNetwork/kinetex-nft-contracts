import type { DeployFunction } from "hardhat-deploy/types";
import type { KinetexRewards, KinetexRewards__factory } from "../typechain";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";

const func: DeployFunction = async function ({ ethers, upgrades, deployments }: HardhatRuntimeEnvironment) {
    const rewardsFactory: KinetexRewards__factory = await ethers.getContractFactory("KinetexRewards");
    const rewards = (await upgrades.deployProxy(rewardsFactory)) as KinetexRewards;
    await rewards.deployed();

    const artifact = await deployments.getExtendedArtifact("KinetexRewards");
    const deployment = {
        address: rewards.address,
        ...artifact,
    };

    await deployments.save("KinetexRewards", deployment);
};

export default func;
func.tags = ["Rewards"];
