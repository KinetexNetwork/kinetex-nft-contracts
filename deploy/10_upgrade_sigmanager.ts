import type { DeployFunction } from "hardhat-deploy/types";
import type { SignatureManager__factory } from "../typechain";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";

const func: DeployFunction = async function ({ ethers, upgrades, deployments }: HardhatRuntimeEnvironment) {
    const managerFactory: SignatureManager__factory = await ethers.getContractFactory("SignatureManager");
    const managerDeployment = await deployments.get("SignatureManager");
    await upgrades.upgradeProxy(managerDeployment.address, managerFactory);
};

export default func;
func.tags = ["upgrade", "SignatureManager", "ktxr"];
