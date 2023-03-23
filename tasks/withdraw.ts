import { BigNumber } from "ethers";
import { task } from "hardhat/config";

task("withdraw", "Unstake a token")
    .addParam("tokenId", "Token to stake")
    .setAction(async (taskArgs: { tokenId: string }, hre) => {
        const stakingDeployment = await hre.deployments.getOrNull("KinetexStaking");
        if (!stakingDeployment) {
            console.log("No deployments for this network");
            return;
        }
        const staking = await hre.ethers.getContractAt("KinetexStaking", stakingDeployment.address);

        const tx = await staking.withdraw([BigNumber.from(taskArgs.tokenId)]);
        const receipt = await tx.wait();

        for (const event of receipt.events!) {
            if (event.event === "Withdraw") {
                console.log("withdraw event:");
                console.log(event.args);
            }
        }
    });
