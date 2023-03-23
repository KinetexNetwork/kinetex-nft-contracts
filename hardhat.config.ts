import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
import "./tasks//";

dotenv.config();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
    solidity: "0.8.9",
    namedAccounts: {
        deployer: process.env["DEPLOYER_ADDRESS"] || "",
        owner: process.env["OWNER_ADDRESS"] || "",
        tester: process.env["TESTER_ADDRESS"] || "",
    },
    networks: {
        hardhat: {
            accounts: [
                {
                    privateKey: process.env["DEPLOYER_PK"] || "",
                    balance: "593900000000000000",
                },
                {
                    privateKey: process.env["OWNER_PK"] || "",
                    balance: "593900000000000000",
                },
                {
                    privateKey: process.env["TESTER_PK"] || "",
                    balance: "10000000000000000000000",
                },
            ],
            forking: {
                enabled: false,
                url: process.env["TESTNET_RPC"] || "",
            },
            // gasPrice: 30_000_000_000,
        },
        testnet: {
            url: process.env["TESTNET_RPC"] || "",
            accounts: process.env.DEPLOYER_PK !== undefined ? [process.env.DEPLOYER_PK] : [],
            // gasPrice: 150_000_000_000,
        },
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD",
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
};

export default config;
