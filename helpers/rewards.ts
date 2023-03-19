import { BigNumber } from "ethers";
import { Result } from "ethers/lib/utils";
import { getNamedAccounts } from "hardhat";
import { KinetexRewards } from "../typechain";

export const mint = async (rewards: KinetexRewards, dustAmt: string): Promise<Result> => {
    const { deployer } = await getNamedAccounts();
    const tx = await rewards.safeMint(deployer, BigNumber.from(dustAmt));
    const receipt = await tx.wait(1);
    const args = receipt.events?.filter((el) => el.event === "Mint")[0].args!;
    return args;
};
