import { task } from "hardhat/config";

task("update-base-uri", "Updates metadata base uri")
    .addParam("uri", "new uri")
    .setAction(async (taskArgs: { uri: string }, hre) => {
        const rewardsDeployment = await hre.deployments.getOrNull("KinetexRewards");
        if (!rewardsDeployment) {
            console.log("No deployment for this network");
            return;
        }
        const collection = await hre.ethers.getContractAt("KinetexRewards", rewardsDeployment.address);
        const tx = await collection.setBaseURI(taskArgs.uri);
        const receipt = await tx.wait();

        for (const event of receipt.events!) {
            if (event.event === "SetBaseURI") {
                console.log("event:");
                console.log(event.args);
            }
        }
    });

task("update-contract-uri", "Updates metadata contract uri")
    .addParam("uri", "new uri")
    .setAction(async (taskArgs: { uri: string }, hre) => {
        const rewardsDeployment = await hre.deployments.getOrNull("KinetexRewards");
        if (!rewardsDeployment) {
            console.log("No deployment for this network");
            return;
        }
        const collection = await hre.ethers.getContractAt("KinetexRewards", rewardsDeployment.address);
        const tx = await collection.setContractURI(taskArgs.uri);
        const receipt = await tx.wait();

        for (const event of receipt.events!) {
            if (event.event === "SetContractURI") {
                console.log("event:");
                console.log(event.args);
            }
        }
    });

task("update-base-uri-ambassador", "Updates metadata base uri for KinetexAmbassador")
    .addParam("uri", "new uri")
    .setAction(async (taskArgs: { uri: string }, hre) => {
        const ambassadorDeployment = await hre.deployments.getOrNull("KinetexAmbassador");
        if (!ambassadorDeployment) {
            console.log("No deployment for this network");
            return;
        }
        const collection = await hre.ethers.getContractAt("KinetexAmbassador", ambassadorDeployment.address);
        const tx = await collection.setBaseURI(taskArgs.uri);
        const receipt = await tx.wait();

        for (const event of receipt.events!) {
            if (event.event === "SetBaseURI") {
                console.log("event:");
                console.log(event.args);
            }
        }
    });

task("update-contract-uri-ambassador", "Updates metadata contract uri for KinetexAmbassador")
    .addParam("uri", "new uri")
    .setAction(async (taskArgs: { uri: string }, hre) => {
        const ambassadorDeployment = await hre.deployments.getOrNull("KinetexAmbassador");
        if (!ambassadorDeployment) {
            console.log("No deployment for this network");
            return;
        }
        const collection = await hre.ethers.getContractAt("KinetexAmbassador", ambassadorDeployment.address);
        const tx = await collection.setContractURI(taskArgs.uri);
        const receipt = await tx.wait();

        for (const event of receipt.events!) {
            if (event.event === "SetContractURI") {
                console.log("event:");
                console.log(event.args);
            }
        }
    });
