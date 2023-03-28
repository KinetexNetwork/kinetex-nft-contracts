import type { DeployFunction } from "hardhat-deploy/types";
import type { KinetexRewards } from "../typechain";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
import { BURNER_ROLE, DEFAULT_ADMIN_ROLE, MINTER_ROLE } from "../helpers/roles";

const func: DeployFunction = async function ({ ethers, deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
    const { deployer } = await getNamedAccounts();

    const rewardsDeployment = await deployments.get("KinetexRewards");
    const rewards = (await ethers.getContractAt("KinetexRewards", rewardsDeployment.address)) as KinetexRewards;

    await rewards.renounceRole(MINTER_ROLE, deployer);
    await rewards.renounceRole(BURNER_ROLE, deployer);
    await rewards.renounceRole(DEFAULT_ADMIN_ROLE, deployer);
};

export default func;
func.tags = ["access", "Rewards"];
