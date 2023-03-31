import type { DeployFunction } from "hardhat-deploy/types";
import type { KinetexRewards, KinetexRewards__factory, SignatureManager } from "../typechain";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { REWARDS_BASE_URI, REWARDS_CONTRACT_URI, ISSUER_ADDRESS } from "../helpers/constants";
import { DEFAULT_ADMIN_ROLE, CONSUMER_ROLE } from "../helpers/roles";

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

    const rewardsFactory: KinetexRewards__factory = await ethers.getContractFactory("KinetexRewards");
    const rewards = (await upgrades.deployProxy(rewardsFactory, [managerDeployment.address])) as KinetexRewards;
    await rewards.deployed();

    const artifact = await deployments.getExtendedArtifact("KinetexRewards");
    const deployment = {
        address: rewards.address,
        ...artifact,
    };

    await rewards.setContractURI(REWARDS_CONTRACT_URI);
    await rewards.setBaseURI(REWARDS_BASE_URI);
    await rewards.grantRole(DEFAULT_ADMIN_ROLE, owner);

    await manager.grantRole(CONSUMER_ROLE, rewards.address);
    await (await manager.registerConsumer(rewards.address, ISSUER_ADDRESS)).wait(1);

    await deployments.save("KinetexRewards", deployment);
};

export default func;
func.tags = ["deployment", "Rewards"];
