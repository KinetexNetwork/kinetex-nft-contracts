import type { DeployFunction } from "hardhat-deploy/types";
import type { SignatureManager__factory } from "../typechain";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";

const func: DeployFunction = async function ({ ethers, upgrades, deployments }: HardhatRuntimeEnvironment) {
    const rewardsFactory: SignatureManager__factory = await ethers.getContractFactory("KinetexRewards");
    const rewardsDeployment = await deployments.get("KinetexRewards");
    await upgrades.upgradeProxy(rewardsDeployment.address, rewardsFactory);
};

export default func;
func.tags = ["upgrade", "KinetexRewards", "ktxr"];
