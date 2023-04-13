import { task } from "hardhat/config";

task("update-issuer", "Mint a KinetexRewards token")
    .addParam("consumer", "consumer contract name aka KinetexRewards")
    .addParam("issuer", "new issuer address")
    .setAction(async (taskArgs: { consumer: string; issuer: string }, hre) => {
        const { owner } = await hre.getNamedAccounts();
        const signer = await hre.ethers.getSigner(owner);

        const managerDeployment = await hre.deployments.getOrNull("SignatureManager");
        const consumerDeployment = await hre.deployments.getOrNull(taskArgs.consumer);
        if (!managerDeployment || !consumerDeployment) {
            console.log("No deployment for this network");
            return;
        }

        const manager = await hre.ethers.getContractAt("SignatureManager", managerDeployment.address);
        const tx = await manager.connect(signer).setIssuer(taskArgs.issuer, consumerDeployment.address);
        await tx.wait();

        console.log(`Issuer updated for ${taskArgs.consumer} at ${consumerDeployment.address}`);
    });

task("register-consumer", "Mint a KinetexRewards token")
    .addParam("consumer", "consumer contract name aka KinetexRewards")
    .addParam("issuer", "new issuer address")
    .setAction(async (taskArgs: { consumer: string; issuer: string }, hre) => {
        const { owner } = await hre.getNamedAccounts();
        const signer = await hre.ethers.getSigner(owner);

        const managerDeployment = await hre.deployments.getOrNull("SignatureManager");
        const consumerDeployment = await hre.deployments.getOrNull(taskArgs.consumer);
        if (!managerDeployment || !consumerDeployment) {
            console.log("No deployment for this network");
            return;
        }

        const manager = await hre.ethers.getContractAt("SignatureManager", managerDeployment.address);
        const tx = await manager.connect(signer).registerConsumer(consumerDeployment.address, taskArgs.issuer);
        await tx.wait();

        console.log(`Consumer registered for ${taskArgs.consumer} at ${consumerDeployment.address}`);
    });

task("check-issuer", "Returns the issuer for a consumer")
    .addParam("consumer", "consumer contract name aka KinetexRewards")
    .setAction(async (taskArgs: { consumer: string }, hre) => {
        const { owner } = await hre.getNamedAccounts();
        const signer = await hre.ethers.getSigner(owner);

        const managerDeployment = await hre.deployments.getOrNull("SignatureManager");
        const consumerDeployment = await hre.deployments.getOrNull(taskArgs.consumer);

        console.log("Consumer deployment: ", consumerDeployment?.address);

        if (!managerDeployment || !consumerDeployment) {
            console.log("No deployment for this network");
            return;
        }

        const manager = await hre.ethers.getContractAt("SignatureManager", managerDeployment.address);
        const issuer = await manager.connect(signer).getIssuer(consumerDeployment.address);

        console.log("Issuer: ", issuer);
    });

task("check-sig-manager", "Returns the issuer for a consumer")
    .addParam("consumer", "consumer contract name aka KinetexRewards")
    .setAction(async (taskArgs: { consumer: string }, hre) => {
        const consumerDeployment = await hre.deployments.getOrNull(taskArgs.consumer);

        if (!consumerDeployment) {
            console.log("No deployment for this network");
            return;
        }

        const consumer = await hre.ethers.getContractAt(taskArgs.consumer, consumerDeployment.address);
        const manager = await consumer._signatureManager();

        console.log("Manager address: ", manager);
    });

task("grant-consumer-role", "Returns the issuer for a consumer")
    .addParam("consumer", "consumer contract name aka KinetexRewards")
    .setAction(async (taskArgs: { consumer: string }, hre) => {
        const role = hre.ethers.utils.solidityKeccak256(["string"], ["CONSUMER_ROLE"]);

        const { owner } = await hre.getNamedAccounts();
        const signer = await hre.ethers.getSigner(owner);

        const managerDeployment = await hre.deployments.getOrNull("SignatureManager");
        const consumerDeployment = await hre.deployments.getOrNull(taskArgs.consumer);
        if (!managerDeployment || !consumerDeployment) {
            console.log("No deployment for this network");
            return;
        }

        const manager = await hre.ethers.getContractAt("SignatureManager", managerDeployment.address);
        const tx = await manager.connect(signer).grantRole(role, consumerDeployment.address);
        await tx.wait();

        console.log(`Consumer registered for ${taskArgs.consumer} at ${consumerDeployment.address}`);
    });
