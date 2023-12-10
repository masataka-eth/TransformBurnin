import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'hardhat-gas-reporter';
import 'hardhat-contract-sizer';
import 'dotenv/config';

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  gasReporter: {
    enabled: process.env.COINMARKETCAP_API_KEY ? true : false,
    // enabled: true,
    currency: "JPY",
    gasPriceApi:
      "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    coinmarketcap:  process.env.COINMARKETCAP_API_KEY,
  },
  networks: {
    hardhat: {},
  },
  etherscan: {
    apiKey: {
      mainnet: process.env['ETHSCAN_KEY'] || '',
      goerli: process.env['ETHSCAN_KEY'] || '',
      sepolia: process.env['ETHSCAN_KEY'] || '',
      polygon: process.env['POLYGONSCAN_KEY'] || '',
      // mumbai: process.env['POLYGONSCAN_KEY'] || '',

    },
  }
};

if (process.env.ALCHEMY_KEY) {
  config.networks!.mainnet = {
    url: "https://eth-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY,
    accounts: [`${process.env.PRIVATE_KEY}`],
  }
  config.networks!.goerli = {
    url: "https://eth-goerli.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY,
    accounts: [`${process.env.PRIVATE_KEY}`],
  }
  config.networks!.sepolia = {
    url: "https://eth-sepolia.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY,
    accounts: [`${process.env.PRIVATE_KEY}`],
  }
  config.networks!.mumbai = {
    url: "https://polygon-mumbai.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY,
    accounts: [`${process.env.PRIVATE_KEY}`],
  }
}

export default config;
