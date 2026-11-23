// ============================================================
//  scripts/syncEvents.js — Backfill Missed On-Chain Events
// ============================================================
//  Usage:
//    node scripts/syncEvents.js [fromBlock] [toBlock]
//  Example:
//    node scripts/syncEvents.js 0
//    node scripts/syncEvents.js 100 250
// ============================================================

require("dotenv").config();
const { ethers } = require("ethers");
const { sequelize } = require("../models");
const contractService = require("../blockchain/contractService");
const escrowAbi = require("../blockchain/abis/Escrow.json");

async function main() {
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS;

  if (!escrowAddress) {
    console.error("❌ ESCROW_CONTRACT_ADDRESS not configured in .env.");
    process.exit(1);
  }

  console.log("=== TrustChain Blockchain Event Backfill ===");
  console.log("RPC URL        :", rpcUrl);
  console.log("Escrow Contract:", escrowAddress);

  // Connect to database
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database.");
  } catch (dbErr) {
    console.error("❌ Failed to connect to database:", dbErr.message);
    process.exit(1);
  }

  // Connect to provider
  let provider;
  try {
    provider = new ethers.JsonRpcProvider(rpcUrl);
    const currentBlock = await provider.getBlockNumber();
    console.log(`Current block  : #${currentBlock}`);

    const args = process.argv.slice(2);
    const fromBlock = args[0] ? parseInt(args[0], 10) : 0;
    const toBlock = args[1] ? parseInt(args[1], 10) : currentBlock;

    console.log(`Scanning range : [${fromBlock} ➜ ${toBlock}]`);

    const contract = new ethers.Contract(escrowAddress, escrowAbi, provider);

    // Query events across all 5 event types
    const eventNames = ["TransactionCreated", "Delivered", "Completed", "Disputed", "Resolved"];
    let allEvents = [];

    for (const name of eventNames) {
      try {
        const filter = contract.filters[name]();
        const events = await contract.queryFilter(filter, fromBlock, toBlock);
        console.log(`  • Found ${events.length} '${name}' event(s)`);
        for (const ev of events) {
          allEvents.push({ name, event: ev });
        }
      } catch (filterErr) {
        console.warn(`  ⚠️ Could not query filter for '${name}': ${filterErr.message}`);
      }
    }

    // Sort chronologically by block number and log index
    allEvents.sort((a, b) => {
      if (a.event.blockNumber !== b.event.blockNumber) {
        return a.event.blockNumber - b.event.blockNumber;
      }
      return (a.event.index || 0) - (b.event.index || 0);
    });

    console.log(`\nProcessing ${allEvents.length} total events in chronological order...`);

    let processedCount = 0;
    for (const item of allEvents) {
      const { name, event } = item;
      const args = event.args;

      if (name === "TransactionCreated") {
        await contractService.handleTransactionCreated(
          args.transactionId,
          args.buyer,
          args.seller,
          args.amount,
          event
        );
      } else if (name === "Delivered") {
        await contractService.handleDelivered(args.transactionId, event);
      } else if (name === "Completed") {
        await contractService.handleCompleted(
          args.transactionId,
          args.seller,
          args.amount,
          event
        );
      } else if (name === "Disputed") {
        await contractService.handleDisputed(
          args.transactionId,
          args.raisedBy,
          event
        );
      } else if (name === "Resolved") {
        await contractService.handleResolved(
          args.transactionId,
          args.releasedToSeller,
          event
        );
      }
      processedCount++;
    }

    console.log(`\n✅ Backfill completed: synchronized ${processedCount} events to the database.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Event backfill failed:", error);
    process.exit(1);
  }
}

main();
