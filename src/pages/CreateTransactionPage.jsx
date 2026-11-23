import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useEscrow } from '../context/EscrowContext';
import * as api from '../services/api';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const CreateTransactionPage = () => {
  const {
    account,
    isConnected,
    connectWallet,
    formatAddress,
    balance,
    isCorrectNetwork,
    switchToTargetNetwork,
    targetNetworkName
  } = useWallet();

  const { createTransaction, pendingAction } = useEscrow();
  const navigate = useNavigate();

  const [sellerAddress, setSellerAddress] = useState('');
  const [amount, setAmount] = useState('0.1');
  const currency = 'ETH';
  const [description, setDescription] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [inspectionDays, setInspectionDays] = useState(3);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [recentUsers, setRecentUsers] = useState([]);

  // Fetch registered users to provide helpful autofill suggestions
  useEffect(() => {
    let isMounted = true;
    api.getAllUsers()
      .then(res => {
        if (isMounted && res.users) {
          const others = res.users.filter(u => !account || u.wallet_address.toLowerCase() !== account.toLowerCase());
          setRecentUsers(others);
          if (others.length > 0) {
            setSellerAddress((current) => current || others[0].wallet_address);
          }
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [account]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) {
      setError('Please connect your MetaMask wallet first.');
      return;
    }
    if (!isCorrectNetwork) {
      setError(`Please switch your MetaMask to ${targetNetworkName} before creating an escrow.`);
      return;
    }
    if (!sellerAddress.trim() || !sellerAddress.startsWith('0x') || sellerAddress.length !== 42) {
      setError('Please enter a valid 42-character Ethereum/Polygon wallet address starting with 0x.');
      return;
    }
    if (sellerAddress.toLowerCase() === account.toLowerCase()) {
      setError('Buyer and Seller addresses cannot be identical.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please specify a positive escrow deposit amount.');
      return;
    }
    if (!description.trim()) {
      setError('Please describe the product, service, or deliverables.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const result = await createTransaction({
        seller: sellerAddress,
        amount,
        currency,
        description,
        deliveryTerms: deliveryTerms || 'Standard terms: deliverables verified within inspection period.',
        inspectionPeriodDays: Number(inspectionDays)
      });

      if (result && result.backendTx) {
        navigate(`/transaction/${result.backendTx.id}`);
      }
    } catch (err) {
      console.error('Create transaction failed:', err);
      setError(err.reason || err.message || 'Transaction rejected or failed. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected || !account) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/10">
          <Wallet className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Connect Wallet to Create Escrow</h1>
        <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
          Creating an escrow locks funds into an autonomous smart contract vault. Connect your MetaMask wallet to proceed.
        </p>
        <button
          onClick={connectWallet}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
        >
          <Wallet className="w-4 h-4" />
          <span>Connect MetaMask</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold mb-2">
          <Lock className="w-3.5 h-3.5" />
          <span>Non-Custodial Escrow Contract</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Initialize Escrow Settlement
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Lock funds into an autonomous smart contract vault until deliverables are verified.
        </p>
      </div>

      {!isCorrectNetwork && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>You are not connected to {targetNetworkName}. Please switch network before executing smart contract calls.</span>
          </div>
          <button
            onClick={switchToTargetNetwork}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
          >
            Switch Network
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Buyer Wallet (Fixed as Connected User) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Buyer / Depositor Wallet (You)
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                <span>{account}</span>
                <span className="text-emerald-400 font-sans font-semibold text-[11px]">Connected</span>
              </div>
            </div>

            {/* Seller Wallet Address */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  Seller / Provider Wallet Address
                </label>
                <span className="text-[11px] text-slate-400">Must be a valid address</span>
              </div>
              <input
                type="text"
                required
                value={sellerAddress}
                onChange={(e) => setSellerAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />

              {/* Suggestions from backend registered users */}
              {recentUsers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-400 mr-1">Registered users:</span>
                  {recentUsers.slice(0, 3).map((user) => (
                    <button
                      key={user.wallet_address}
                      type="button"
                      onClick={() => setSellerAddress(user.wallet_address)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>{user.name || user.role}</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        ({formatAddress(user.wallet_address)})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Escrow Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0.0001"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Available in Wallet: {balance}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Currency Token
                </label>
                <select
                  value={currency}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="ETH">ETH (Native Token)</option>
                  
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Product / Service Description
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Smart Contract Security Audit & Automated Test Suite"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Delivery Terms & Specifications */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Expected Delivery Terms & Deliverables
              </label>
              <textarea
                rows={3}
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                placeholder="Specify deliverable format, GitHub PR URL, acceptance criteria, or files expected..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Inspection Window */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Inspection Window (Days)
              </label>
              <select
                value={inspectionDays}
                onChange={(e) => setInspectionDays(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value={1}>1 Day (Fast digital asset inspection)</option>
                <option value={3}>3 Days (Recommended for code & design)</option>
                <option value={7}>7 Days (Extended review period)</option>
                <option value={14}>14 Days (Physical or complex development)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Buyer has {inspectionDays} days post-delivery to confirm or open a dispute before anyone can trigger settlement on-chain. Settlement requires a transaction.
              </p>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:opacity-95 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing in MetaMask...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Lock Escrow Funds in Smart Contract</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-400 mt-2">
                Triggers MetaMask to send {amount || '0'} {currency} into the Escrow smart contract.
              </p>
            </div>

          </form>
        </div>

        {/* Live Escrow Summary Card */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Escrow Summary</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Locked Deposit:</span>
                <span className="font-bold text-white font-mono">{amount || '0'} {currency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Protocol Fee:</span>
                <span className="text-emerald-400 font-mono font-bold">0.00 {currency} (0%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Inspection Window:</span>
                <span className="text-slate-200">{inspectionDays} Days</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-200">Total Escrowed:</span>
                <span className="text-cyan-400 font-mono">{amount || '0'} {currency}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Funds held in smart contract until you explicitly confirm completion.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Both parties build verifiable on-chain reputation upon release.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Protected by TrustChain arbitrator in case of disputes.</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Real on-chain transaction: Signed and verified via MetaMask.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Real Web3 Signing Dialog / Pending Action */}
      {(submitting || pendingAction) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/50 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center mx-auto text-cyan-400">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>

            <h3 className="text-lg font-bold text-white">
              Processing Escrow Creation
            </h3>

            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              {pendingAction?.message || 'Please approve the transaction in MetaMask and wait for the block confirmation...'}
            </p>

            <div className="py-2">
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-1.5 animate-pulse w-full"
                />
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Deposit: <span className="text-white font-bold">{amount} {currency}</span> | Vault: <span className="text-emerald-400">TrustChain Escrow</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
