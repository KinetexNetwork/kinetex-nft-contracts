import { BigNumber } from "ethers";
import { Result } from "ethers/lib/utils";
import { ethers, getNamedAccounts } from "hardhat";
import { KinetexRewards } from "../typechain";

export const mint = async (rewards: KinetexRewards, dustAmt: string): Promise<Result> => {
    const { deployer } = await getNamedAccounts();
    const tx = await rewards.safeMintPriveleged(deployer, BigNumber.from(dustAmt));
    const receipt = await tx.wait(1);
    const args = receipt.events?.filter((el) => el.event === "Mint")[0].args!;
    return args;
};

export const grantReward = async (to: string, dust: string, nonce: string): Promise<string> => {
    const { issuer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(issuer);
    const message = ethers.utils.solidityPack(
        ["address", "uint256", "uint256"],
        [to, BigNumber.from(dust), BigNumber.from(nonce)]
    );
    const hash = ethers.utils.solidityKeccak256(["bytes"], [message]);
    return await signer.signMessage(ethers.utils.arrayify(hash));
};
