import { BigNumber } from "ethers";
import { task } from "hardhat/config";

task("craft", "Craft from two tokens")
    .addParam("tokenA", "first token tokenId")
    .addParam("tokenB", "first token tokenId")
    .setAction(async (taskArgs: { tokenA: string; tokenB: string }, hre) => {
        const rewardsDeployment = await hre.deployments.getOrNull("KinetexRewards");
        const craftingDeployment = await hre.deployments.getOrNull("KinetexCrafting");
        if (!craftingDeployment || !rewardsDeployment) {
            console.log("No deployment for this network");
            return;
        }
        const crafting = await hre.ethers.getContractAt("KinetexCrafting", craftingDeployment.address);
        const rewards = await hre.ethers.getContractAt("KinetexRewards", rewardsDeployment.address);

        await rewards.approve(crafting.address, BigNumber.from(taskArgs.tokenA));
        await rewards.approve(crafting.address, BigNumber.from(taskArgs.tokenB));

        const tx = await crafting.craft(BigNumber.from(taskArgs.tokenA), BigNumber.from(taskArgs.tokenB));
        const receipt = await tx.wait();

        for (const event of receipt.events!) {
            if (event.event === "Craft") {
                console.log("craft event:");
                console.log(event.args);
            }
        }
    });
