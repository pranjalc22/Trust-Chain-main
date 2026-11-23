// ============================================================
//  deploy.js — TrustChain Deployment Script
// ============================================================
//  Deploys Escrow.sol and Reputation.sol to the target network
//  and links them together so the Escrow contract can update
//  user reputations.
//
//  Usage:
//    npx hardhat run scripts/deploy.js --network localhost
// ============================================================

const hre = require("hardhat");

async function main() {
  // Get the list of accounts from the network
  const [deployer, , arbitrator] = await hre.ethers.getSigners();

  console.log("=== TrustChain Deployment ===");
  console.log("Deployer address :", deployer.address);
  console.log("Arbitrator address:", arbitrator.address);
  console.log("");

  // ----------------------------------------------------------
  //  Step 1: Deploy Escrow contract
  // ----------------------------------------------------------
  console.log("1. Deploying Escrow contract...");
  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(arbitrator.address);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("   Escrow deployed at:", escrowAddress);

  // ----------------------------------------------------------
  //  Step 2: Deploy Reputation contract (linked to Escrow)
  // ----------------------------------------------------------
  console.log("2. Deploying Reputation contract...");
  const Reputation = await hre.ethers.getContractFactory("Reputation");
  const reputation = await Reputation.deploy(escrowAddress);
  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();
  console.log("   Reputation deployed at:", reputationAddress);

  // ----------------------------------------------------------
  //  Step 3: Link Escrow → Reputation
  // ----------------------------------------------------------
  console.log("3. Linking Escrow to Reputation contract...");
  // setReputationContract is onlyArbitrator, so we call it from
  // the arbitrator's signer
  const escrowAsArbitrator = escrow.connect(arbitrator);
  const linkTx = await escrowAsArbitrator.setReputationContract(reputationAddress);
  await linkTx.wait();
  console.log("   Escrow now knows about Reputation ✓");

  // ----------------------------------------------------------
  //  Summary
  // ----------------------------------------------------------
  console.log("");
  console.log("=== Deployment Complete ===");
  console.log("Escrow     :", escrowAddress);
  console.log("Reputation :", reputationAddress);
  console.log("Arbitrator :", arbitrator.address);
  console.log("");
  console.log("Next steps:");
  console.log("  • Start the local node:  npx hardhat node");
  console.log("  • Run this script:       npx hardhat run scripts/deploy.js --network localhost");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
