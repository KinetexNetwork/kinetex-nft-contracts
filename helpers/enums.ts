import { BigNumber } from "ethers";

export const Level = {
    DUST: BigNumber.from("0"),
    GEM: BigNumber.from("1"),
    CRYSTAL: BigNumber.from("2"),
    LIGHTNING: BigNumber.from("3"),
};

export const AmbassadorLevel = {
    JUNIOR: BigNumber.from("0"),
    MASTER: BigNumber.from("1"),
    MAGISTER: BigNumber.from("2"),
    LEGENDARY: BigNumber.from("3"),
};
