// ============================================================
//  services/contracts.js — Smart-Contract Interaction Layer
// ============================================================
//  Wraps ethers.js calls to the Escrow and Reputation contracts
//  using the connected MetaMask signer.
// ============================================================

import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers';
import { ESCROW_CONTRACT_ADDRESS, REPUTATION_CONTRACT_ADDRESS } from '../config';

// Minimal ABIs — only the functions the frontend calls directly
const ESCROW_ABI = [
  'function refundExpired(uint256 id) external',
  'function inspectionDays(uint256 id) view returns (uint256)',
  'function createTransaction(address payable _seller, uint256 daysToInspect) external payable returns (uint256 transactionId)',
  'function markDelivered(uint256 _transactionId) external',
  'function confirmCompletion(uint256 _transactionId) external',
  'function raiseDispute(uint256 _transactionId) external',
  'function resolveDispute(uint256 _transactionId, bool _releaseToSeller) external',
  'function getTransaction(uint256 _transactionId) external view returns (address buyer, address seller, uint256 amount, uint8 status, uint256 createdAt, uint256 updatedAt)',
  'function transactionCount() external view returns (uint256)',
  'event TransactionCreated(uint256 indexed transactionId, address indexed buyer, address indexed seller, uint256 amount)',
  'event Delivered(uint256 indexed transactionId)',
  'event Completed(uint256 indexed transactionId, address indexed seller, uint256 amount)',
  'event Disputed(uint256 indexed transactionId, address indexed raisedBy)',
  'event Resolved(uint256 indexed transactionId, bool releasedToSeller)',
];

const REPUTATION_ABI = [
  'function hasRated(uint256 transactionId, address rater) view returns (bool)',
  'function submitRating(uint256 transactionId, address _ratedUser, uint8 _stars) external',
  'function getReputationScore(address _user) external view returns (uint256 score)',
  'function getReputation(address _user) external view returns (uint256 completedTransactions, uint256 disputesLost, uint256 disputesWon, uint256 totalRatingSum, uint256 ratingCount)',
];

// Status enum mapping from Solidity
const STATUS_MAP = ['Created', 'Delivered', 'Completed', 'Disputed', 'Refunded'];

// ─── Helpers ─────────────────────────────────────────────────

let _provider = null;
let _signer = null;

/** Returns the BrowserProvider (creates lazily). */
export function getProvider() {
  if (!window.ethereum) throw new Error('MetaMask is not installed.');
  if (!_provider) _provider = new BrowserProvider(window.ethereum);
  return _provider;
}

/** Reset cached provider/signer (e.g. on account/chain change). */
export function resetProviderCache() {
  _provider = null;
  _signer = null;
}

/** Returns the current MetaMask signer. */
export async function getSigner() {
  const provider = getProvider();
  _signer = await provider.getSigner();
  return _signer;
}

/** Returns a read-only Escrow contract instance. */
export function getEscrowReadOnly() {
  return new Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, getProvider());
}

/** Returns a signer-connected Escrow contract instance. */
export async function getEscrowContract() {
  const signer = await getSigner();
  return new Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);
}

/** Returns a signer-connected Reputation contract instance. */
export async function getReputationContract() {
  const signer = await getSigner();
  return new Contract(REPUTATION_CONTRACT_ADDRESS, REPUTATION_ABI, signer);
}

/** Returns a read-only Reputation contract instance. */
export function getReputationReadOnly() {
  return new Contract(REPUTATION_CONTRACT_ADDRESS, REPUTATION_ABI, getProvider());
}

// ─── Contract Write Methods ─────────────────────────────────

/**
 * Creates an on-chain escrow transaction.
 * @param {string} sellerAddress  — 0x-prefixed seller wallet
 * @param {string} amountInEther  — e.g. "1.5"
 * @returns {{ txHash: string, onChainTxId: string, receipt: object }}
 */
export async function createEscrowTransaction(sellerAddress, amountInEther, inspectionDays = 3) {
  const escrow = await getEscrowContract();
  const tx = await escrow.createTransaction(sellerAddress, inspectionDays, {
    value: parseEther(amountInEther),

  });
  const receipt = await tx.wait();

  // Parse the TransactionCreated event to extract the on-chain ID
  let onChainTxId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = escrow.interface.parseLog({ topics: log.topics, data: log.data });
      if (parsed && parsed.name === 'TransactionCreated') {
        onChainTxId = parsed.args.transactionId.toString();
        break;
      }
    } catch {
      // skip logs from other contracts
    }
  }
  return { txHash: receipt.hash, onChainTxId, receipt };
}

/**
 * Seller marks an on-chain transaction as delivered.
 * @param {number|string} onChainTxId
 */
export async function markDeliveredOnChain(onChainTxId) {
  const escrow = await getEscrowContract();
  const tx = await escrow.markDelivered(onChainTxId);
  return await tx.wait();
}

/**
 * Buyer confirms completion — releases escrow funds to seller.
 * @param {number|string} onChainTxId
 */
export async function confirmCompletionOnChain(onChainTxId) {
  const escrow = await getEscrowContract();
  const tx = await escrow.confirmCompletion(onChainTxId);
  return await tx.wait();
}

/**
 * Either party raises a dispute.
 * @param {number|string} onChainTxId
 */
export async function raiseDisputeOnChain(onChainTxId) {
  const escrow = await getEscrowContract();
  const tx = await escrow.raiseDispute(onChainTxId);
  return await tx.wait();
}

/**
 * Arbitrator resolves a dispute.
 * @param {number|string} onChainTxId
 * @param {boolean} releaseToSeller
 */
export async function resolveDisputeOnChain(onChainTxId, releaseToSeller) {
  const escrow = await getEscrowContract();
  const tx = await escrow.resolveDispute(onChainTxId, releaseToSeller);
  return await tx.wait();
}

/**
 * Submit an on-chain star rating for a counterparty.
 * @param {string} ratedUserAddress
 * @param {number} stars 1-5
 */
export async function submitRatingOnChain(transactionId, ratedUserAddress, stars) {
  const rep = await getReputationContract();
  if (await rep.hasRated(transactionId, await (await getSigner()).getAddress())) return;
  const tx = await rep.submitRating(transactionId, ratedUserAddress, stars);
  return await tx.wait();
}

// ─── Contract Read Methods ──────────────────────────────────

/**
 * Reads an on-chain transaction's data.
 */
export async function getOnChainTransaction(onChainTxId) {
  const escrow = getEscrowReadOnly();
  const data = await escrow.getTransaction(onChainTxId);
  return {
    inspectionDays: Number(await escrow.inspectionDays(onChainTxId)),
    buyer: data[0],
    seller: data[1],
    amount: formatEther(data[2]),
    status: STATUS_MAP[Number(data[3])] || 'Unknown',
    statusText: STATUS_MAP[Number(data[3])] || 'Unknown',
    createdAt: new Date(Number(data[4]) * 1000),
    updatedAt: new Date(Number(data[5]) * 1000),
  };
}

export const getEscrowTransaction = getOnChainTransaction;

/**
 * Reads reputation data directly from the on-chain contract.
 */
export async function getOnChainReputation(walletAddress) {
  const rep = getReputationReadOnly();
  const score = await rep.getReputationScore(walletAddress);
  const data = await rep.getReputation(walletAddress);
  const ratingCount = Number(data[4]);
  return {
    on_chain_score: Number(score),
    score: Number(score), // legacy alias
    completedTransactions: Number(data[0]),
    disputesLost: Number(data[1]),
    disputesWon: Number(data[2]),
    totalRatingSum: Number(data[3]),
    ratingCount,
    averageRating: ratingCount > 0 ? +(Number(data[3]) / ratingCount).toFixed(2) : 0,
  };
}

// ─── Error Classification ───────────────────────────────────

/**
 * Returns a user-friendly error message for blockchain errors.
 */
export function classifyContractError(err) {
  const msg = err?.message || err?.reason || String(err);
  const info = err?.info?.error?.message || '';
  const combined = `${msg} ${info}`.toLowerCase();

  if (combined.includes('user rejected') || combined.includes('user denied') || combined.includes('action_rejected')) {
    return { type: 'rejected', message: 'Transaction was rejected in MetaMask.' };
  }
  if (combined.includes('insufficient funds') || combined.includes('exceeds balance')) {
    return { type: 'funds', message: 'Insufficient funds to complete this transaction.' };
  }
  if (combined.includes('nonce') && combined.includes('too')) {
    return { type: 'nonce', message: 'Nonce error — try resetting your MetaMask account activity.' };
  }
  if (combined.includes('network') || combined.includes('could not detect network')) {
    return { type: 'network', message: 'Network error — please check your connection and try again.' };
  }
  // Smart contract revert reasons
  if (combined.includes('escrow:') || combined.includes('reputation:')) {
    const match = combined.match(/(escrow:|reputation:)\s*(.+?)"/i) ||
      combined.match(/(escrow:|reputation:)\s*(.+)/i);
    if (match) return { type: 'contract', message: match[0].replace(/"/g, '') };
  }
  return { type: 'unknown', message: msg.slice(0, 200) };
}

export async function refundExpiredOnChain(id) { const escrow = await getEscrowContract(); return (await escrow.refundExpired(id)).wait(); }
