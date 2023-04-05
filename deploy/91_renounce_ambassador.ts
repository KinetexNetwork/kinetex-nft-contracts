import type { DeployFunction } from "hardhat-deploy/types";
import type { KinetexAmbassador, KinetexRewards } from "../typechain";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
import { BURNER_ROLE, DEFAULT_ADMIN_ROLE, MINTER_ROLE } from "../helpers/roles";

const func: DeployFunction = async function ({ ethers, deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
    const { deployer } = await getNamedAccounts();

    const ambassadorDeployment = await deployments.get("KinetexAmbassador");
    const ambassador = (await ethers.getContractAt(
        "KinetexAmbassador",
        ambassadorDeployment.address
    )) as KinetexAmbassador;

    await ambassador.renounceRole(MINTER_ROLE, deployer);
    await ambassador.renounceRole(BURNER_ROLE, deployer);
    await ambassador.renounceRole(DEFAULT_ADMIN_ROLE, deployer);
};

export default func;
func.tags = ["access", "Rewards", "ktxr"];
