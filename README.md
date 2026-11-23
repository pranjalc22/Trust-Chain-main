# TrustChain — Decentralized Escrow & Reputation Protocol

TrustChain is a decentralized Web3 commerce and settlement protocol that eliminates counterparty risk using non-custodial smart contract escrows and tamper-proof, transaction-weighted reputation scoring.

---

## 🏛️ Project Architecture

```
Trust-Chain/
├── blockchain/        # Solidity contracts (Escrow.sol, Reputation.sol) & Hardhat
├── backend/           # Node.js / Express REST API, PostgreSQL, JWT, and event sync
└── src/               # React 18 frontend (Vite, ethers.js v6, Tailwind CSS)
```

---

## 🚀 Quickstart Guide (Local Development & Demo)

Run each step in a separate terminal window:

### Step 1: Start Local Hardhat Blockchain Node

```bash
cd blockchain
npm install
npx hardhat node
```
> Keep this terminal open. It runs a local Ethereum JSON-RPC node on `http://127.0.0.1:8545` with 20 funded test accounts (10,000 ETH each).

---

### Step 2: Compile & Deploy Smart Contracts

In a **second terminal**:
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

The script prints the deployed contract addresses:
```
Escrow deployed to:     0x5FbDB2315678afecb367f032d93F642f64180aa3
Reputation deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

> **Note:** These default addresses are pre-configured in `src/config.js` and `backend/.env.example`. If your deployment outputs different addresses, update `src/config.js` and `backend/.env`.

---

### Step 3: Start Backend REST API

In a **third terminal**:
```bash
cd backend
cp .env.example .env
# Set a random JWT_SECRET and provision the PostgreSQL database in DATABASE_URL.
npm install
npm run dev
```

The backend starts at `http://localhost:3001`.
- Verify health: `http://localhost:3001/api/health`
- Run test suite: `node scripts/testApi.js` (runs 11/11 automated E2E tests)

---

### Step 4: Start Frontend React App

In a **fourth terminal** (root directory):
```bash
npm install
cp .env.example .env      # defaults target the local Hardhat node (chain 31337)
npm run dev
```

Open your browser to: **`http://localhost:5173`**

> The frontend defaults to the local Hardhat network (`VITE_CHAIN_ID=31337`). If you deploy to Polygon Amoy instead, set `VITE_CHAIN_ID=80002` in the root `.env` along with the deployed contract addresses.

---

## 🦊 MetaMask Configuration

To interact with local contracts:

1. **Add Custom Network in MetaMask**:
   - **Network Name:** Hardhat Localhost
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`

2. **Import Demo Accounts** using their private keys:
   - **Alice (Buyer)**:
     - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
     - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - **Bob (Seller / Provider)**:
     - Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
     - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - **Carol (DAO Arbitrator)**:
     - Address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
     - Private Key: `0x5de4111afa1a4b94908f83103eb2f95408a2ed56bcf2775f560c5ea933391708`

---

## 🎬 College Demo Workflow Walkthrough

1. **Reset Demo State**:
   - Click the purple **"Reset Demo"** button in the Navbar. This seeds fresh sample transactions across all statuses (In Progress, Delivered, Completed, Disputed).

2. **Create New Escrow (Buyer Flow)**:
   - Connect MetaMask as **Alice** (`0xf39F...`).
   - Navigate to **"Create Escrow"**.
   - Select **Bob** (`0x7099...`) as seller, input `0.1` ETH, describe deliverables, and submit.
   - MetaMask prompts to confirm the deposit transaction. Once confirmed, funds are locked in the smart contract.

3. **Deliver Work (Seller Flow)**:
   - Switch MetaMask to **Bob** (`0x7099...`).
   - Open the transaction detail page and click **"Mark as Delivered"**.
   - Confirm the transaction in MetaMask. The inspection period is now active.

4. **Confirm Completion & Rate Reputation (Buyer Flow)**:
   - Switch MetaMask back to **Alice**.
   - Click **"Confirm Completion & Release Escrow"**.
   - Confetti triggers! Funds are disbursed to Bob.
   - The **Review Modal** opens: rate Bob 5 stars and leave a review. This anchors the rating on-chain and updates Bob's reputation score.

5. **Arbitration & Dispute Resolution**:
   - Open the **Disputed transaction** or raise a dispute on an active escrow.
   - Switch MetaMask to **Carol** (`0x3C44...`).
   - Navigate to the **"Arbitration"** page.
   - Inspect buyer claims and seller defense evidence.
   - Click **"Rule for Seller"** or **"Rule for Buyer"** to execute the verdict directly via the Escrow smart contract.

---

## 🛡️ Key Features

- **Non-Custodial Escrow**: Autonomous smart contract vault holds assets safely without centralized custody.
- **On-Chain + Off-Chain Reputation**: Transparent scoring combining completed volume, peer ratings, and dispute outcomes.
- **DAO Arbitration Court**: Cryptographic dispute resolution mechanism for contractual disagreements.
- **Repeatable Presentation Mode**: Built-in 1-click database reset for continuous, predictable demonstrations.

## Contract migration
Redeploy the updated contracts to a fresh local chain and use a fresh database. Configure both contract addresses in frontend and backend environments. Demo database reset is disabled; create real funded escrows for demos. Inspection expiry allows permissionless completion; undelivered escrows and unresolved disputes permit a buyer refund after 30 days via refundExpired(id). These require a submitted transaction, not an automatic timer.
