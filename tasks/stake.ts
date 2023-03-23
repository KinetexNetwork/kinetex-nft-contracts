import { BigNumber } from "ethers";
import { task } from "hardhat/config";

task("stake", "Stake a token")
    .addParam("tokenId", "Token to stake")
    .addParam("months", "How many months to stake for")
    .setAction(async (taskArgs: { tokenId: string; months: string }, hre) => {
        const rewardsDeployment = await hre.deployments.getOrNull("KinetexRewards");
        const stakingDeployment = await hre.deployments.getOrNull("KinetexStaking");
        if (!stakingDeployment || !rewardsDeployment) {
            console.log("No deployments for this network");
            return;
        }
        const staking = await hre.ethers.getContractAt("KinetexStaking", stakingDeployment.address);
        const rewards = await hre.ethers.getContractAt("KinetexRewards", rewardsDeployment.address);

        await rewards.approve(staking.address, BigNumber.from(taskArgs.tokenId));

        const tx = await staking.stake([BigNumber.from(taskArgs.tokenId)], BigNumber.from(taskArgs.months));
        const receipt = await tx.wait();

        for (const event of receipt.events!) {
            if (event.event === "Stake") {
                console.log("stake event:");
                console.log(event.args);
            }
        }
    });
