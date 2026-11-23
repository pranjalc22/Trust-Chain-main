// ============================================================
//  config.js — Frontend configuration for TrustChain
// ============================================================
//  Central config for API URL, contract addresses, and network.
//  Change these values when deploying to a different environment.
// ============================================================

// Backend API base URL (no trailing slash)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Deployed smart-contract addresses (defaults match the Hardhat local deploy script output)
export const ESCROW_CONTRACT_ADDRESS =
  import.meta.env.VITE_ESCROW_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const REPUTATION_CONTRACT_ADDRESS =
  import.meta.env.VITE_REPUTATION_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

// Target network — defaults to the local Hardhat node described in the README.
// To point the dApp at Polygon Amoy instead, set VITE_CHAIN_ID=80002 in .env.
export const TARGET_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '31337', 10);

export const TARGET_NETWORK = {
  chainId: `0x${TARGET_CHAIN_ID.toString(16)}`,
  chainName: TARGET_CHAIN_ID === 31337 ? 'Hardhat Localhost' : 'Polygon Amoy Testnet',
  rpcUrls: TARGET_CHAIN_ID === 31337
    ? ['http://127.0.0.1:8545']
    : ['https://rpc-amoy.polygon.technology'],
  nativeCurrency: {
    name: TARGET_CHAIN_ID === 31337 ? 'ETH' : 'MATIC',
    symbol: TARGET_CHAIN_ID === 31337 ? 'ETH' : 'MATIC',
    decimals: 18,
  },
  blockExplorerUrls: TARGET_CHAIN_ID === 31337
    ? []
    : ['https://amoy.polygonscan.com/'],
};
