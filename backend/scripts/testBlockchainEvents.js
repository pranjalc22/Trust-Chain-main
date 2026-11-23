// ============================================================
//  scripts/testBlockchainEvents.js — Event Handler Test Suite
// ============================================================

process.env.DATABASE_URL = "sqlite::memory:";
process.env.NODE_ENV = "test";

const { ethers } = require("ethers");
const { sequelize, Transaction, Dispute } = require("../models");
const contractService = require("../blockchain/contractService");

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function run() {
  console.log("==================================================");
  console.log("⛓️ Testing ContractService Event Handlers & Sync");
  console.log("==================================================\n");

  await sequelize.sync({ force: true });

  const buyer = "0x1111111111111111111111111111111111111111";
  const seller = "0x2222222222222222222222222222222222222222";
  const amountWei = ethers.parseEther("3.5");

  // 1. TransactionCreated event
  console.log("🔹 [Event 1] handleTransactionCreated");
  await contractService.handleTransactionCreated(1, buyer, seller, amountWei);
  const tx1 = await Transaction.findOne({ where: { on_chain_tx_id: "1" } });
  assert(tx1 !== null, "Transaction created in DB from event");
  assert(tx1.status === "Created", "Initial status is 'Created'");
  assert(tx1.amount === "3.5", "Amount parsed to '3.5' ETH");
  assert(tx1.buyer_wallet === buyer.toLowerCase(), "Buyer address normalized and saved");
  assert(tx1.seller_wallet === seller.toLowerCase(), "Seller address normalized and saved");

  // 2. Delivered event
  console.log("\n🔹 [Event 2] handleDelivered");
  await contractService.handleDelivered(1);
  await tx1.reload();
  assert(tx1.status === "Delivered", "Transaction status updated to 'Delivered'");

  // 3. Completed event
  console.log("\n🔹 [Event 3] handleCompleted");
  await contractService.handleCompleted(1, seller, amountWei);
  await tx1.reload();
  assert(tx1.status === "Completed", "Transaction status updated to 'Completed'");

  // 4. Disputed event on a second transaction
  console.log("\n🔹 [Event 4] handleDisputed");
  await contractService.handleTransactionCreated(2, buyer, seller, ethers.parseEther("1.0"));
  await contractService.handleDisputed(2, buyer);
  const tx2 = await Transaction.findOne({ where: { on_chain_tx_id: "2" } });
  assert(tx2.status === "Disputed", "Transaction #2 status updated to 'Disputed'");
  const dispute = await Dispute.findOne({ where: { transaction_id: tx2.id } });
  assert(dispute !== null, "Dispute record automatically created");
  assert(dispute.status === "Open", "Dispute status is 'Open'");
  assert(dispute.raised_by === buyer.toLowerCase(), "Dispute raised_by is buyer");

  // 5. Resolved event (funds refunded to buyer)
  console.log("\n🔹 [Event 5] handleResolved");
  await contractService.handleResolved(2, false); // false = refunded to buyer
  await tx2.reload();
  await dispute.reload();
  assert(tx2.status === "Refunded", "Transaction #2 status updated to 'Refunded'");
  assert(dispute.status === "Resolved_Buyer", "Dispute marked 'Resolved_Buyer'");
  assert(dispute.resolution.includes("refunded"), "Dispute resolution text recorded");

  console.log("\n==================================================");
  console.log("🎉 ALL BLOCKCHAIN EVENT TESTS PASSED!");
  console.log("==================================================\n");

  await sequelize.close();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
