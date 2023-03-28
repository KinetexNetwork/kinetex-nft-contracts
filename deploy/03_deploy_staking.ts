import type { DeployFunction } from "hardhat-deploy/types";
import type { KinetexStaking, KinetexStaking__factory } from "../typechain";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

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
    const rewardsDeployment = await deployments.get("KinetexRewards");

    const stakingFactory: KinetexStaking__factory = await ethers.getContractFactory("KinetexStaking");
    const staking = (await upgrades.deployProxy(stakingFactory, [rewardsDeployment.address])) as KinetexStaking;
    await staking.deployed();

    const artifact = await deployments.getExtendedArtifact("KinetexCrafting");
    const deployment = {
        address: staking.address,
        ...artifact,
    };

    await staking.transferOwnership(owner);

    await deployments.save("KinetexStaking", deployment);
};

export default func;
func.tags = ["deployment", "Staking"];
