// ============================================================
//  controllers/demoController.js — Reset and Seed Demo Data
// ============================================================
//  Provides one-click reset to clean, realistic test data for
//  college presentations and repeatable demo flows.
// ============================================================

const { User, Transaction, Dispute, Rating } = require("../models");

const ALICE = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".toLowerCase();
const BOB = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".toLowerCase();
const CAROL = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC".toLowerCase();
const DAVE = "0x90F79bf6EB2c4f870365E785982E1f101E93b906".toLowerCase();
const ELENA = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65".toLowerCase();

/**
 * POST /api/demo/reset
 * Wipes current records and re-seeds standard demo accounts and transactions.
 */
const resetDemoData = async (req, res, next) => {
  try {
    // Clean up tables in proper foreign key order
    await Rating.destroy({ where: {}, truncate: false });
    await Dispute.destroy({ where: {}, truncate: false });
    await Transaction.destroy({ where: {}, truncate: false });
    await User.destroy({ where: {}, truncate: false });

    // 1. Seed demo users
    await User.bulkCreate([
      {
        wallet_address: ALICE,
        display_name: "Alice (Buyer & Client)",
        bio: "Decentralized application founder hiring top Web3 developers and security auditors.",
      },
      {
        wallet_address: BOB,
        display_name: "Bob (Full-Stack Solidity Dev)",
        bio: "Specialist in ERC standard smart contract architecture, zero-knowledge circuits, and React dApps.",
      },
      {
        wallet_address: CAROL,
        display_name: "Carol (TrustChain DAO Arbitrator)",
        bio: "Certified smart contract auditor and arbitration judge on the TrustChain dispute board.",
      },
      {
        wallet_address: DAVE,
        display_name: "Dave (UI/UX Web3 Designer)",
        bio: "Designing responsive, intuitive glassmorphic decentralized user interfaces.",
      },
      {
        wallet_address: ELENA,
        display_name: "Elena (Security Researcher)",
        bio: "Formal verification and fuzz testing for DeFi and cross-chain bridge protocols.",
      },
    ]);

    // 2. Seed demo transactions
    await Transaction.create({
      buyer_wallet: ALICE,
      seller_wallet: BOB,
      description: "Full-Stack Web3 Security Audit & Gas Optimization",
      amount: "0.5",
      currency: "ETH",
      status: "In Progress",
      on_chain_tx_id: 1,
      delivery_terms: "Comprehensive Slither and Echidna security audit report with gas reduction diffs.",
    });

    await Transaction.create({
      buyer_wallet: ALICE,
      seller_wallet: BOB,
      description: "Decentralized Escrow Smart Contract & Unit Tests",
      amount: "1.2",
      currency: "ETH",
      status: "Delivered",
      on_chain_tx_id: 2,
      delivery_terms: "Hardhat test suite with 100% line coverage and deployment scripts.",
    });

    const tx3 = await Transaction.create({
      buyer_wallet: ALICE,
      seller_wallet: BOB,
      description: "Glassmorphic Web3 Frontend & MetaMask Integration",
      amount: "0.8",
      currency: "ETH",
      status: "Completed",
      on_chain_tx_id: 3,
      delivery_terms: "React + Vite frontend responsive dashboard and real-time state hooks.",
    });

    const tx4 = await Transaction.create({
      buyer_wallet: ALICE,
      seller_wallet: DAVE,
      description: "Design System & Figma Component Library",
      amount: "0.4",
      currency: "ETH",
      status: "Disputed",
      on_chain_tx_id: 4,
      delivery_terms: "Mobile responsive wireframes and vector design tokens.",
    });

    // 3. Seed rating for completed transaction 3
    await Rating.create({
      transaction_id: tx3.id,
      from_wallet: ALICE,
      to_wallet: BOB,
      stars: 5,
      comment: "Exceptional delivery! Thorough code quality, fast turn-around, and smooth escrow release.",
    });

    // 4. Seed dispute record for transaction 4
    await Dispute.create({
      transaction_id: tx4.id,
      raised_by: ALICE,
      status: "Open",
      evidence_buyer: "The delivered Figma file is missing mobile viewport breakpoints specified in section 3 of milestone terms.",
      evidence_seller: "Initial design tokens delivered; responsive layouts were scheduled for milestone 2 as per our initial agreement.",
    });

    return res.status(200).json({
      success: true,
      message: "TrustChain demo database reset and seeded with fresh test scenarios!",
      summary: {
        users: 5,
        transactions: 4,
        ratings: 1,
        disputes: 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  resetDemoData,
};
