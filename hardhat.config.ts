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

const forkingUrl = () => {
    const isTestnet = !!process.env["IS_TESTNET"];
    if (isTestnet) {
        const polygon = process.env["MUMBAI_RPC"] ?? "";
        const ethereum = process.env["GOERLI_RPC"] ?? "";
        return process.env["CHAIN"] === "Polygon" ? polygon : ethereum;
    }

    return process.env["MAINNET_RPC"] ?? "";
};

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
                url: forkingUrl(),
            },
        },
        mumbai: {
            url: process.env["MUMBAI_RPC"] || "",
            accounts: process.env.DEPLOYER_PK !== undefined ? [process.env.DEPLOYER_PK] : [],
        },
        goerli: {
            url: process.env["GOERLI_RPC"] || "",
            accounts: process.env.DEPLOYER_PK !== undefined ? [process.env.DEPLOYER_PK] : [],
        },
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD",
    },
    etherscan: {
        apiKey: {
            polygonMumbai: process.env["POLYGONSCAN_API_KEY"] ?? "",
            goerli: process.env["ETHERSCAN_API_KEY"],
            mainnet: process.env["ETHERSCAN_API_KEY"],
        },
    },
};

export default config;
