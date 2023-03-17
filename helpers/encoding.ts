import { keccak256, solidityKeccak256, toUtf8Bytes } from "ethers/lib/utils";
import { ethers } from "hardhat";

export const encodeKeccak = (data: string) => keccak256(ethers.utils.toUtf8Bytes(data));
export const encodeSolityKeccak = (data: string) => {
    return solidityKeccak256(["string"], [data]);
};
