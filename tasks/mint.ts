import { BigNumber } from "ethers";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const grantReward = async (
    hre: HardhatRuntimeEnvironment,
    to: string,
    dust: string,
    nonce: string
): Promise<string> => {
    const { issuer } = await hre.getNamedAccounts();
    const signer = hre.ethers.provider.getSigner(issuer);
    const message = hre.ethers.utils.solidityPack(
        ["address", "uint256", "uint256"],
        [to, BigNumber.from(dust), BigNumber.from(nonce)]
    );
    const hash = hre.ethers.utils.solidityKeccak256(["bytes"], [message]);
    return await signer.signMessage(hre.ethers.utils.arrayify(hash));
};

task("mint-reward-priveleged", "Mint a KinetexRewards token without signature verification")
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

task("mint-reward", "Mint a KinetexRewards token")
    .addParam("dust", "crystal dust amount")
    .addParam("nonce", "signature nonce")
    .setAction(async (taskArgs: { dust: string; nonce: string }, hre) => {
        const rewardsDeployment = await hre.deployments.getOrNull("KinetexRewards");
        if (!rewardsDeployment) {
            console.log("No deployment for this network");
            return;
        }
        const { deployer } = await hre.getNamedAccounts();
        const collection = await hre.ethers.getContractAt("KinetexRewards", rewardsDeployment.address);
        const sig = await grantReward(hre, deployer, taskArgs.dust, taskArgs.nonce);
        const tx = await collection.safeMint(
            deployer,
            BigNumber.from(taskArgs.dust),
            BigNumber.from(taskArgs.nonce),
            sig
        );
        const receipt = await tx.wait();

        for (const event of receipt.events!) {
            if (event.event === "Mint") {
                console.log("mint event:");
                console.log(event.args);
            }
        }
    });

task("mint-ambassador", "Mint a KinetexAmbassador token")
    .addParam("level", "ambassador level")
    .addParam("nonce", "signature nonce")
    .setAction(async (taskArgs: { level: string; nonce: string }, hre) => {
        const ambassadorDeployment = await hre.deployments.getOrNull("KinetexAmbassador");
        if (!ambassadorDeployment) {
            console.log("No deployment for this network");
            return;
        }
        const { deployer } = await hre.getNamedAccounts();
        const collection = await hre.ethers.getContractAt("KinetexAmbassador", ambassadorDeployment.address);
        const sig = await grantReward(hre, deployer, taskArgs.level, taskArgs.nonce);
        const tx = await collection.safeMint(
            deployer,
            BigNumber.from(taskArgs.level),
            BigNumber.from(taskArgs.nonce),
            sig
        );
        const receipt = await tx.wait();

        for (const event of receipt.events!) {
            if (event.event === "Mint") {
                console.log("mint event:");
                console.log(event.args);
            }
        }
    });
