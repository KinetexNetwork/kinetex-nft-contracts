import type { DeployFunction } from "hardhat-deploy/types";
import type { KinetexAmbassador, KinetexAmbassador__factory, KinetexRewards, SignatureManager } from "../typechain";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { AMBASSADOR_BASE_URI, AMBASSADOR_CONTRACT_URI, ISSUER_ADDRESS } from "../helpers/constants";
import { DEFAULT_ADMIN_ROLE, CONSUMER_ROLE, MINTER_ROLE } from "../helpers/roles";

import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";

const func: DeployFunction = async function ({
    ethers,
    upgrades,
    deployments,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) {
    const { owner } = await getNamedAccounts();

    const managerDeployment = await deployments.get("SignatureManager");
    const manager = (await ethers.getContractAt("SignatureManager", managerDeployment.address)) as SignatureManager;

    const rewardsDeployment = await deployments.get("KinetexRewards");
    const rewards = (await ethers.getContractAt("KinetexRewards", rewardsDeployment.address)) as KinetexRewards;

    const ambassadorFactory: KinetexAmbassador__factory = await ethers.getContractFactory("KinetexAmbassador");
    const ambassador = (await upgrades.deployProxy(ambassadorFactory, [
        managerDeployment.address,
        rewardsDeployment.address,
    ])) as KinetexAmbassador;
    await ambassador.deployed();

    const artifact = await deployments.getExtendedArtifact("KinetexAmbassador");
    const deployment = {
        address: ambassador.address,
        ...artifact,
    };

    await ambassador.setContractURI(AMBASSADOR_CONTRACT_URI);
    await ambassador.setBaseURI(AMBASSADOR_BASE_URI);
    await ambassador.grantRole(DEFAULT_ADMIN_ROLE, owner);

    await manager.grantRole(CONSUMER_ROLE, ambassador.address);
    await (await manager.registerConsumer(ambassador.address, ISSUER_ADDRESS)).wait(1);

    await rewards.grantRole(MINTER_ROLE, ambassador.address);

    await deployments.save("KinetexAmbassador", deployment);
};

export default func;
func.tags = ["deployment", "Rewards"];
