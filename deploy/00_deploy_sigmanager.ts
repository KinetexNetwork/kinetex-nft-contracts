import type { DeployFunction } from "hardhat-deploy/types";
import type { SignatureManager, SignatureManager__factory } from "../typechain";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
import { ISSUER_ADDRESS } from "../helpers/constants";
import { DEFAULT_ADMIN_ROLE, MANAGER_ROLE } from "../helpers/roles";

const func: DeployFunction = async function ({
    ethers,
    upgrades,
    deployments,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) {
    const { owner } = await getNamedAccounts();

    const managerFactory: SignatureManager__factory = await ethers.getContractFactory("SignatureManager");
    const manager = (await upgrades.deployProxy(managerFactory, [ISSUER_ADDRESS])) as SignatureManager;
    await manager.deployed();

    const artifact = await deployments.getExtendedArtifact("SignatureManager");
    const deployment = {
        address: manager.address,
        ...artifact,
    };

    await manager.grantRole(DEFAULT_ADMIN_ROLE, owner);
    await manager.grantRole(MANAGER_ROLE, owner);

    await deployments.save("SignatureManager", deployment);
};

export default func;
func.tags = ["deployment", "SignatureManager"];
