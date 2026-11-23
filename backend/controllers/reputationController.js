// ============================================================
//  controllers/reputationController.js — Live On-Chain Reputation
// ============================================================

const contractService = require("../blockchain/contractService");

/**
 * Reads live on-chain reputation directly from the Reputation smart contract.
 * GET /api/reputation/:wallet
 */
const getLiveReputation = async (req, res, next) => {
  try {
    const { wallet } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Ethereum wallet address format.",
      });
    }

    try {
      const liveData = await contractService.getOnChainReputation(wallet);

      return res.status(200).json({
        success: true,
        source: "smart_contract",
        data: liveData,
      });
    } catch (contractErr) {
      return res.status(503).json({
        success: false,
        message: `Failed to query live on-chain reputation: ${contractErr.message}`,
        hint: "Ensure your Ethereum node/Hardhat node is running and REPUTATION_CONTRACT_ADDRESS is set in .env.",
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLiveReputation,
};
