import { task } from "hardhat/config";

task("mint", "Mint a token")
    .addParam("dust", "crystal dust amount")
    .setAction(async (taskArgs: { dust: string }, hre) => {
        const rewardsDeployment = await hre.deployments.getOrNull("KinetexRewards");
        if (!rewardsDeployment) {
            console.log("No deployment for this network");
            return;
        }
        const { deployer } = await hre.getNamedAccounts();
        const collection = await hre.ethers.getContractAt("KinetexRewards", rewardsDeployment.address);
        const tx = await collection.safeMintPriveleged(deployer, parseInt(taskArgs.dust, 10));
        const receipt = await tx.wait();

        for (const event of receipt.events!) {
            if (event.event === "Mint") {
                console.log("mint event:");
                console.log(event.args);
            }
        }
    });
