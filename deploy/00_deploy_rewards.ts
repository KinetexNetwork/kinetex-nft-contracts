import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { KinetexRewards } from "../typechain";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    console.log("deploying KinetexRewards");
    const { deployer, owner } = await hre.getNamedAccounts();

    const deployment = await hre.deployments.deploy("KinetexRewards", {
        from: deployer,
        args: [],
        log: true,
        autoMine: true,
        waitConfirmations: 1,
    });

    const rewards: KinetexRewards = await hre.ethers.getContractAt("KinetexRewards", deployment.address);
    // await rewards.initialize();
    // await rewards.transferOwnership(owner);
};

export default func;
func.tags = ["Rewards"];
