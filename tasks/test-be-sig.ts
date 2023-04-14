import { BigNumber } from "ethers";
import { task } from "hardhat/config";

task("test-be-mint", "Mint a KinetexRewards token")
    .addParam("to", "crystal dust amount")
    .addParam("dust", "crystal dust amount")
    .addParam("nonce", "crystal dust amount")
    .addParam("signature", "crystal dust amount")
    .setAction(async (taskArgs: { to: string; dust: string; nonce: string; signature: string }, hre) => {
        const rewardsDeployment = await hre.deployments.getOrNull("KinetexRewards");
        if (!rewardsDeployment) {
            console.log("No deployment for this network");
            return;
        }

        const collection = await hre.ethers.getContractAt("KinetexRewards", rewardsDeployment.address);
        const tx = await collection.safeMint(
            taskArgs.to,
            BigNumber.from(taskArgs.dust),
            BigNumber.from(taskArgs.nonce),
            taskArgs.signature
        );
        const receipt = await tx.wait();

        for (const event of receipt.events!) {
            if (event.event === "Mint") {
                console.log("mint event:");
                console.log(event.args);
            }
        }
    });

task("test-be-sig", "Mint a KinetexRewards token")
    .addParam("to", "crystal dust amount")
    .addParam("dust", "crystal dust amount")
    .addParam("nonce", "crystal dust amount")
    .addParam("signature", "crystal dust amount")
    .setAction(async (taskArgs: { to: string; dust: string; nonce: string; signature: string }, hre) => {
        const managerDeployment = await hre.deployments.getOrNull("SignatureManager");
        const rewardsDeployment = await hre.deployments.getOrNull("KinetexRewards");
        if (!managerDeployment || !rewardsDeployment) {
            console.log("No deployment for this network");
            return;
        }

        const manager = await hre.ethers.getContractAt("SignatureManager", managerDeployment.address);
        const isValid = await manager.verifySignature(
            taskArgs.to,
            BigNumber.from(taskArgs.dust),
            BigNumber.from(taskArgs.nonce),
            taskArgs.signature,
            rewardsDeployment.address
        );

        console.log(isValid);
    });

task("test-manager-call", "Checks the signature through KinetexRewards")
    .addParam("to", "crystal dust amount")
    .addParam("dust", "crystal dust amount")
    .addParam("nonce", "crystal dust amount")
    .addParam("signature", "crystal dust amount")
    .setAction(async (taskArgs: { to: string; dust: string; nonce: string; signature: string }, hre) => {
        const rewardsDeployment = await hre.deployments.getOrNull("KinetexRewards");
        if (!rewardsDeployment) {
            console.log("No deployment for this network");
            return;
        }

        const rewards = await hre.ethers.getContractAt("KinetexRewards", rewardsDeployment.address);
        const args = await rewards.checkSignature(
            taskArgs.to,
            BigNumber.from(taskArgs.dust),
            BigNumber.from(taskArgs.nonce),
            taskArgs.signature
        );

        console.log(args);
    });
