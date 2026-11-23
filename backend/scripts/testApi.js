// ============================================================
//  scripts/testApi.js — Automated API End-to-End Test Suite
// ============================================================
//  Tests all requirements:
//   1. Wallet signature auth (MetaMask pattern with ethers.js)
//   2. JWT issuance & verification
//   3. Transaction creation & retrieval
//   4. Status transitions
//   5. Rating constraint (rejects before Completed, accepts after)
//   6. Dispute creation & open disputes list
//   7. Reputation aggregation
//   8. Input validations
// ============================================================

// Use SQLite in-memory database for clean, self-contained test execution
process.env.DATABASE_URL = "sqlite::memory:";
process.env.JWT_SECRET = "test-jwt-secret-key-12345";
process.env.NODE_ENV = "test";

const http = require("http");
const { ethers } = require("ethers");
const app = require("../app");
const { sequelize } = require("../models");

let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: json });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log("==================================================");
  console.log("🧪 Starting TrustChain Backend Test Suite");
  console.log("==================================================\n");

  // 1. Initialize SQLite in-memory tables
  await sequelize.sync({ force: true });
  console.log("✓ In-memory database initialized and synced.\n");

  // 2. Start HTTP server on random available port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`✓ Test HTTP server listening on ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // --------------------------------------------------------
    // TEST 1: Health Check
    // --------------------------------------------------------
    console.log("🔹 [Test 1] Health check endpoint");
    const health = await request("GET", "/api/health");
    assert(health.status === 200, "Health check returns 200");
    assert(health.body.status === "ok", "Health check status is 'ok'");

    // --------------------------------------------------------
    // TEST 2: Wallet Authentication (MetaMask Sign-In Pattern)
    // --------------------------------------------------------
    console.log("\n🔹 [Test 2] Wallet-based Authentication");
    const alice = ethers.Wallet.createRandom();
    const bob = ethers.Wallet.createRandom();

    console.log(`  Alice wallet: ${alice.address}`);
    console.log(`  Bob wallet:   ${bob.address}`);

    // 2a. Request challenge nonce
    const nonceRes = await request("POST", "/api/auth/nonce", {
      wallet_address: alice.address,
    });
    assert(nonceRes.status === 200, "Nonce generation returns 200");
    assert(nonceRes.body.nonce, "Nonce string returned");
    assert(nonceRes.body.message.includes(nonceRes.body.nonce), "Message contains challenge nonce");

    // 2b. Sign challenge message using Alice's private key (simulating MetaMask)
    const signature = await alice.signMessage(nonceRes.body.message);

    // 2c. Verify valid signature and obtain JWT
    const verifyRes = await request("POST", "/api/auth/verify", {
      wallet_address: alice.address,
      signature,
    });
    assert(verifyRes.status === 200, "Signature verification returns 200");
    assert(verifyRes.body.token, "JWT token issued");
    const aliceToken = verifyRes.body.token;

    // 2d. Replay attack prevention: trying same signature again should fail
    const replayRes = await request("POST", "/api/auth/verify", {
      wallet_address: alice.address,
      signature,
    });
    assert(replayRes.status === 401, "Replay attack rejected with 401");

    // 2e. Forged signature test: Bob attempts to impersonate Alice
    const forgedMessage = nonceRes.body.message;
    const forgedSignature = await bob.signMessage(forgedMessage);
    const forgeRes = await request("POST", "/api/auth/verify", {
      wallet_address: alice.address,
      signature: forgedSignature,
    });
    assert(forgeRes.status === 401, "Forged signature rejected with 401");

    // --------------------------------------------------------
    // TEST 3: Create Escrow Transaction (MetaMask on_chain_tx_id)
    // --------------------------------------------------------
    console.log("\n🔹 [Test 3] Create Escrow Transaction Record");
    const createTxRes = await request(
      "POST",
      "/api/transactions",
      {
        seller_wallet: bob.address,
        description: "Solidity Escrow & Security Audit",
        amount: "2.5",
        currency: "ETH",
        on_chain_tx_id: "1",
        status: "Created",
      },
      { Authorization: `Bearer ${aliceToken}` }
    );
    assert(createTxRes.status === 201, "Transaction created with status 201");
    assert(createTxRes.body.transaction.buyer_wallet.toLowerCase() === alice.address.toLowerCase(), "Buyer wallet assigned to Alice");
    assert(createTxRes.body.transaction.seller_wallet.toLowerCase() === bob.address.toLowerCase(), "Seller wallet assigned to Bob");
    assert(createTxRes.body.transaction.on_chain_tx_id === "1", "on_chain_tx_id saved");
    const txId = createTxRes.body.transaction.id;

    // --------------------------------------------------------
    // TEST 4: Get Transaction Details & User Transactions
    // --------------------------------------------------------
    console.log("\n🔹 [Test 4] Query Transactions");
    const getTxRes = await request("GET", `/api/transactions/${txId}`);
    assert(getTxRes.status === 200, "Get transaction by ID returns 200");
    assert(getTxRes.body.transaction.id === txId, "Returned correct transaction ID");

    const getUserTxRes = await request("GET", `/api/transactions/user/${alice.address}`);
    assert(getUserTxRes.status === 200, "Get user transactions returns 200");
    assert(getUserTxRes.body.transactions.length >= 1, "User has at least 1 transaction");

    // --------------------------------------------------------
    // TEST 5: Rating Barrier (Must fail when status !== 'Completed')
    // --------------------------------------------------------
    console.log("\n🔹 [Test 5] Rating Submission Barrier");
    const prematureRatingRes = await request(
      "POST",
      "/api/ratings",
      {
        transaction_id: txId,
        to_wallet: bob.address,
        stars: 5,
        comment: "Excellent work!",
      },
      { Authorization: `Bearer ${aliceToken}` }
    );
    assert(
      prematureRatingRes.status === 400,
      "Rating rejected with 400 when transaction is not 'Completed'"
    );
    assert(
      prematureRatingRes.body.message.includes("Completed"),
      "Error message specifies 'Completed' prerequisite"
    );

    // --------------------------------------------------------
    // TEST 6: Status Transitions to 'Completed'
    // --------------------------------------------------------
    console.log("\n🔹 [Test 6] Transaction Status Transitions");
    const deliverRes = await request(
      "PATCH",
      `/api/transactions/${txId}/status`,
      { status: "Delivered" },
      { Authorization: `Bearer ${aliceToken}` }
    );
    assert(deliverRes.status === 200, "Status updated to Delivered");
    assert(deliverRes.body.transaction.status === "Delivered", "Transaction status is Delivered");

    const completeRes = await request(
      "PATCH",
      `/api/transactions/${txId}/status`,
      { status: "Completed" },
      { Authorization: `Bearer ${aliceToken}` }
    );
    assert(completeRes.status === 200, "Status updated to Completed");
    assert(completeRes.body.transaction.status === "Completed", "Transaction status is Completed");

    // --------------------------------------------------------
    // TEST 7: Rating Submission (Now succeeds because status === 'Completed')
    // --------------------------------------------------------
    console.log("\n🔹 [Test 7] Submit Rating After Completion");
    const ratingRes = await request(
      "POST",
      "/api/ratings",
      {
        transaction_id: txId,
        to_wallet: bob.address,
        stars: 5,
        comment: "Outstanding smart contract audit, highly recommended!",
      },
      { Authorization: `Bearer ${aliceToken}` }
    );
    assert(ratingRes.status === 201, "Rating submitted successfully with status 201");
    assert(ratingRes.body.rating.stars === 5, "Rating recorded 5 stars");

    // Duplicate rating test
    const dupRatingRes = await request(
      "POST",
      "/api/ratings",
      {
        transaction_id: txId,
        to_wallet: bob.address,
        stars: 4,
      },
      { Authorization: `Bearer ${aliceToken}` }
    );
    assert(dupRatingRes.status === 400, "Duplicate rating from same user rejected with 400");

    // --------------------------------------------------------
    // TEST 8: User Profile & Reputation Calculation
    // --------------------------------------------------------
    console.log("\n🔹 [Test 8] User Profile & Reputation Info");
    const profileRes = await request("GET", `/api/users/${bob.address}`);
    assert(profileRes.status === 200, "Get user profile returns 200");
    assert(profileRes.body.reputation.completed_transactions === 1, "Completed transactions count is 1");
    assert(profileRes.body.reputation.total_ratings === 1, "Total ratings count is 1");
    assert(profileRes.body.reputation.average_rating === 5, "Average rating is 5.0");
    assert(profileRes.body.reputation.calculated_score > 50, "Reputation score calculated above base");

    // --------------------------------------------------------
    // TEST 9: Dispute Creation & Open Disputes Query
    // --------------------------------------------------------
    console.log("\n🔹 [Test 9] Dispute Workflow");
    // Create second transaction for dispute testing
    const tx2Res = await request(
      "POST",
      "/api/transactions",
      {
        buyer_wallet: alice.address,
        seller_wallet: bob.address,
        description: "Frontend Integration",
        amount: "1.0",
        currency: "ETH",
        status: "In Progress",
      },
      { Authorization: `Bearer ${aliceToken}` }
    );
    const tx2Id = tx2Res.body.transaction.id;

    // Raise dispute
    const disputeRes = await request(
      "POST",
      "/api/disputes",
      {
        transaction_id: tx2Id,
        raised_by: alice.address,
        evidence_buyer: "Seller missed delivery milestone by 2 weeks with no communication.",
      },
      { Authorization: `Bearer ${aliceToken}` }
    );
    assert(disputeRes.status === 201, "Dispute created with 201");
    assert(disputeRes.body.dispute.status === "Open", "Dispute status is Open");

    // Check transaction status was updated to Disputed
    const tx2Check = await request("GET", `/api/transactions/${tx2Id}`);
    assert(tx2Check.body.transaction.status === "Disputed", "Transaction marked as Disputed");

    // List open disputes
    const openDisputesRes = await request("GET", "/api/disputes/open");
    assert(openDisputesRes.status === 200, "Get open disputes returns 200");
    assert(openDisputesRes.body.disputes.length >= 1, "Open disputes list contains active dispute");

    // Arbitrator resolves dispute
    const disputeId = disputeRes.body.dispute.id;
    const resolveRes = await request(
      "PATCH",
      `/api/disputes/${disputeId}/resolve`,
      {
        outcome: "Resolved_Buyer",
        resolution: "Evidence verified on Github commit history; refunding buyer.",
      },
      { Authorization: `Bearer ${aliceToken}` }
    );
    assert(resolveRes.status === 200, "Dispute resolved with 200");
    assert(resolveRes.body.dispute.status === "Resolved_Buyer", "Dispute marked Resolved_Buyer");

    const tx2ResolvedCheck = await request("GET", `/api/transactions/${tx2Id}`);
    assert(tx2ResolvedCheck.body.transaction.status === "Refunded", "Transaction status updated to Refunded");

    // --------------------------------------------------------
    // TEST 10: Input Validation
    // --------------------------------------------------------
    console.log("\n🔹 [Test 10] Input Validations");
    // 10a. Invalid wallet address format in nonce
    const badAddressRes = await request("POST", "/api/auth/nonce", {
      wallet_address: "not-an-eth-address",
    });
    assert(badAddressRes.status === 400, "Invalid wallet address rejected with 400");
    assert(badAddressRes.body.errors.length > 0, "Validation error details returned");

    // 10b. Invalid rating stars (> 5)
    const badStarsRes = await request(
      "POST",
      "/api/ratings",
      {
        transaction_id: txId,
        to_wallet: bob.address,
        stars: 10,
      },
      { Authorization: `Bearer ${aliceToken}` }
    );
    assert(badStarsRes.status === 400, "Rating stars > 5 rejected with 400");

    // 10c. Missing required fields in transaction
    const emptyTxRes = await request(
      "POST",
      "/api/transactions",
      {},
      { Authorization: `Bearer ${aliceToken}` }
    );
    assert(emptyTxRes.status === 400, "Empty transaction payload rejected with 400");

    // --------------------------------------------------------
    // TEST 11: Live On-Chain Reputation Endpoint
    // --------------------------------------------------------
    console.log("\n🔹 [Test 11] Live On-Chain Reputation Endpoint");
    const onChainRepRes = await request("GET", `/api/reputation/${alice.address}`);
    // Contract may or may not be running locally; endpoint must handle gracefully
    assert(
      onChainRepRes.status === 200 || onChainRepRes.status === 503,
      `GET /api/reputation/:wallet responded gracefully (status: ${onChainRepRes.status})`
    );

    console.log("\n==================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! (11/11 Suites)");
    console.log("==================================================\n");
  } finally {
    server.close();
    await sequelize.close();
  }
}

runTests().catch((err) => {
  console.error("\n❌ Test execution failed:", err);
  process.exit(1);
});
