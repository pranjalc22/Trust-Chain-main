// ============================================================
//  services/api.js — Backend REST API Client
// ============================================================
//  Thin wrapper around fetch() that talks to the Express backend.
//  Every exported function returns { success, ...data } or throws.
// ============================================================

import { API_BASE_URL } from '../config';

// ----- helpers -----

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  // Attach JWT if stored
  const token = localStorage.getItem('trustchain_jwt');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || `API ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ----- health -----

export const healthCheck = () => request('/health');

// ----- wallet authentication -----

/** POST /api/auth/nonce — request a one-time challenge message to sign */
export const requestAuthNonce = (wallet) =>
  request('/auth/nonce', { method: 'POST', body: JSON.stringify({ wallet_address: wallet }) });

/** POST /api/auth/verify — exchange a signed challenge for a JWT */
export const verifyAuthSignature = (wallet, signature) =>
  request('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ wallet_address: wallet, signature }),
  });

// ----- transactions -----

/** POST /api/transactions — record a new escrow deal after on-chain creation */
export const createTransaction = (body) =>
  request('/transactions', { method: 'POST', body: JSON.stringify(body) });

/** GET /api/transactions/user/:wallet */
export const getUserTransactions = (wallet) =>
  request(`/transactions/user/${wallet.toLowerCase()}`);

/** GET /api/transactions/:id */
export const getTransactionById = (id) =>
  request(`/transactions/${id}`);

/** PATCH /api/transactions/:id/status */
export const updateTransactionStatus = (id, body) =>
  request(`/transactions/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) });

// ----- disputes -----

/** POST /api/disputes */
export const createDispute = (body) =>
  request('/disputes', { method: 'POST', body: JSON.stringify(body) });

/** GET /api/disputes/open */
export const getOpenDisputes = () =>
  request('/disputes/open');

/** PATCH /api/disputes/:id/resolve */
export const resolveDispute = (id, body) =>
  request(`/disputes/${id}/resolve`, { method: 'PATCH', body: JSON.stringify(body) });

// ----- ratings -----

/** POST /api/ratings */
export const submitRating = (body) =>
  request('/ratings', { method: 'POST', body: JSON.stringify(body) });

/** GET /api/ratings/user/:wallet */
export const getUserRatings = (wallet) =>
  request(`/ratings/user/${wallet.toLowerCase()}`);

// ----- users -----

/** GET /api/users */
export const getAllUsers = () =>
  request('/users');

/** GET /api/users/:wallet */
export const getUserProfile = (wallet) =>
  request(`/users/${wallet.toLowerCase()}`);

/** PUT /api/users/:wallet */
export const updateUserProfile = (wallet, body) =>
  request(`/users/${wallet.toLowerCase()}`, { method: 'PUT', body: JSON.stringify(body) });

// ----- reputation -----

/** GET /api/reputation/:wallet — live on-chain reputation read-through */
export const getLiveReputation = (wallet) =>
  request(`/reputation/${wallet.toLowerCase()}`);

// ----- demo admin -----

/** POST /api/demo/reset — re-seeds database with standard demo data */
export const resetDemoData = () =>
  request('/demo/reset', { method: 'POST' });
