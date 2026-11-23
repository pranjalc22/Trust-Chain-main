// hardhat.config.js
// --------------------------------------------------
// Hardhat configuration file for the TrustChain project.
// It tells Hardhat which Solidity compiler version to use
// and what networks are available for deployment.
// --------------------------------------------------

require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // Solidity compiler settings
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true, // Enable the optimizer for smaller contract size
        runs: 200,     // Optimize for ~200 tx (standard default)
      },
    },
  },

  // Network configurations
  networks: {
    // Hardhat's built-in local network (used by default)
    hardhat: {},

    // Example: local Hardhat node started via `npx hardhat node`
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
};
