import type { DeployFunction } from "hardhat-deploy/types";
import type { KinetexRewards, SignatureManager } from "../typechain";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
import { DEFAULT_ADMIN_ROLE, MANAGER_ROLE } from "../helpers/roles";

const func: DeployFunction = async function ({ ethers, deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
    const { deployer } = await getNamedAccounts();

    const managerDeployment = await deployments.get("SignatureManager");
    const manager = (await ethers.getContractAt("SignatureManager", managerDeployment.address)) as SignatureManager;

    await manager.renounceRole(MANAGER_ROLE, deployer);
    await manager.renounceRole(DEFAULT_ADMIN_ROLE, deployer);
};

export default func;
func.tags = ["access", "Rewards"];
