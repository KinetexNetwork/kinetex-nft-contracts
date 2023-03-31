import { ethers } from "hardhat";
import { encodeSolityKeccak } from "./encoding";

export const DEFAULT_ADMIN_ROLE = ethers.utils.formatBytes32String("0x00");
export const MINTER_ROLE = encodeSolityKeccak("MINTER_ROLE");
export const BURNER_ROLE = encodeSolityKeccak("BURNER_ROLE");

export const CONSUMER_ROLE = encodeSolityKeccak("CONSUMER_ROLE");
