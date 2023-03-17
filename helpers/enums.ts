import { BigNumber } from "ethers";

export const Level = {
    DUST: BigNumber.from("0"),
    GEM: BigNumber.from("1"),
    CRYSTAL: BigNumber.from("2"),
    LIGHTNING: BigNumber.from("3"),
};
