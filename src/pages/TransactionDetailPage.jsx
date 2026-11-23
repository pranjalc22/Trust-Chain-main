import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useEscrow } from '../context/EscrowContext';
import * as api from '../services/api';
import * as contracts from '../services/contracts';
import { StatusBadge } from '../components/common/StatusBadge';
import { ReputationBadge } from '../components/common/ReputationBadge';
import { DisputeModal } from '../components/modals/DisputeModal';
import { ReviewModal } from '../components/modals/ReviewModal';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRightLeft,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  User,
  ShieldCheck,
  Send,
  Sparkles,
  RefreshCw,
  Wallet
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const TransactionDetailPage = () => {
  const { id } = useParams();
  const { account, formatAddress, isConnected, connectWallet, isCorrectNetwork, switchToTargetNetwork } = useWallet();
  const {
    markDelivered,
    confirmCompletion,
    raiseDispute,
    submitReview,
    pendingAction
  } = useEscrow();

  const [transaction, setTransaction] = useState(null);
  const [onChainTx, setOnChainTx] = useState(null);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [disputeRecord, setDisputeRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals & form state
  const [deliveryProofInput, setDeliveryProofInput] = useState('');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [evidenceText, setEvidenceText] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [evidenceSubmitting, setEvidenceSubmitting] = useState(false);

  // Fetch full transaction data and counterpart profiles
  const loadTransactionData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTransactionById(id);
      const tx = res.transaction;
      setTransaction(tx);
      setOnChainTx(null);
      setDisputeRecord(null);

      // If dispute exists on transaction
      if (tx.dispute) {
        setDisputeRecord(tx.dispute);
      }

      // Fetch counterparties profiles in parallel
      const buyerPromise = tx.buyer_wallet
        ? api.getUserProfile(tx.buyer_wallet).catch(() => null)
        : Promise.resolve(null);
      const sellerPromise = tx.seller_wallet
        ? api.getUserProfile(tx.seller_wallet).catch(() => null)
        : Promise.resolve(null);

      // Also read on-chain escrow state if on_chain_tx_id exists
      const onChainPromise = (tx.on_chain_tx_id !== null && tx.on_chain_tx_id !== undefined)
        ? contracts.getEscrowTransaction(tx.on_chain_tx_id).catch(() => null)
        : Promise.resolve(null);

      const [buyerRes, sellerRes, chainTx] = await Promise.all([
        buyerPromise,
        sellerPromise,
        onChainPromise
      ]);

      if (buyerRes) setBuyerProfile(buyerRes);
      if (sellerRes) setSellerProfile(sellerRes);
      if (chainTx) setOnChainTx(chainTx);
    } catch (err) {
      console.error('Failed to load transaction details:', err);
      setError('Failed to fetch transaction details from backend.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Fetch transaction data whenever the route id changes.
    // eslint-disable-next-line react/set-state-in-effect
    loadTransactionData();
  }, [loadTransactionData]);

  // Handle Mark Delivered
  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!transaction) return;
    setActionLoading(true);
    try {
      await markDelivered(transaction.id, transaction.on_chain_tx_id);
      setShowDeliveryModal(false);
      await loadTransactionData();
    } catch (err) {
      console.error('Delivery confirmation error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Confirm Completion
  const handleConfirmCompletion = async () => {
    if (!transaction) return;
    setActionLoading(true);
    try {
      await confirmCompletion(transaction.id, transaction.on_chain_tx_id);
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } catch {}
      await loadTransactionData();
      setShowReviewModal(true);
    } catch (err) {
      console.error('Confirm completion error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Dispute Submission
  const handleDisputeSubmit = async (reason) => {
    if (!transaction) return;
    setActionLoading(true);
    try {
      await raiseDispute(transaction.id, transaction.on_chain_tx_id, reason);
      setShowDisputeModal(false);
      await loadTransactionData();
    } catch (err) {
      console.error('Dispute submission error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Review Submission
  const handleReviewSubmit = async ({ stars, comment }) => {
    if (!transaction) return;
    setActionLoading(true);
    try {
      const recipient = isBuyer ? transaction.seller_wallet : transaction.buyer_wallet;
      await submitReview(transaction.id, recipient, stars, comment);
      await loadTransactionData();
    } catch (err) {
      console.error('Review submit error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Evidence Submission
  const handleAddEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceText.trim() || !transaction) return;
    setEvidenceSubmitting(true);
    try {
      const fullText = attachmentName ? `${evidenceText} [Attachment: ${attachmentName}]` : evidenceText;
      await api.createDispute({
        transaction_id: transaction.id,
        raised_by: account,
        [isBuyer ? 'evidence_buyer' : 'evidence_seller']: fullText
      });
      setEvidenceText('');
      setAttachmentName('');
      await loadTransactionData();
    } catch (err) {
      console.error('Evidence submission error:', err);
    } finally {
      setEvidenceSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-slate-800 rounded-xl w-48" />
          <div className="h-7 bg-slate-800 rounded-xl w-36" />
        </div>
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 space-y-6">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-slate-800" />
                <div className="h-3 bg-slate-800 rounded w-20" />
              </div>
            ))}
          </div>
          <div className="h-1 bg-slate-800 rounded-full" />
          <div className="flex justify-between items-start pt-4">
            <div className="space-y-2 w-1/2">
              <div className="h-7 bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-800/60 rounded w-full" />
            </div>
            <div className="w-32 h-16 bg-slate-800/70 rounded-2xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5" />
          <div className="h-44 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5" />
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-white">Transaction not found</h2>
        <p className="text-xs text-slate-400 mt-2">{error || 'The requested escrow transaction does not exist.'}</p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const buyerAddr = (transaction.buyer_wallet || transaction.buyer || '').toLowerCase();
  const sellerAddr = (transaction.seller_wallet || transaction.seller || '').toLowerCase();
  const userAddr = (account || '').toLowerCase();

  const isBuyer = userAddr && userAddr === buyerAddr;
  const isSeller = userAddr && userAddr === sellerAddr;
  const isParty = isBuyer || isSeller;

  const currentStatus = onChainTx?.status || transaction.status;

  // Visual Stepper Steps
  const steps = [
    { key: 'Created', label: 'Order Created' },
    { key: 'In Progress', label: 'Funds Escrowed' },
    { key: 'Delivered', label: 'Delivered' },
    { key: 'Completed', label: 'Settled / Released' }
  ];

  const getStepState = (stepKey) => {
    if (currentStatus === 'Disputed') {
      return stepKey === 'Created' || stepKey === 'In Progress' ? 'completed' : 'disputed';
    }
    if (currentStatus === 'Refunded') {
      return stepKey === 'Created' || stepKey === 'In Progress' ? 'completed' : 'refunded';
    }
    const order = ['Created', 'In Progress', 'Delivered', 'Completed'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const buyerRepScore = buyerProfile?.reputation?.calculated_score ?? 85;
  const sellerRepScore = sellerProfile?.reputation?.calculated_score ?? 85;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-white">
                Escrow #{transaction.id}
              </h1>
              {transaction.on_chain_tx_id !== null && transaction.on_chain_tx_id !== undefined && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                  Chain #{transaction.on_chain_tx_id}
                </span>
              )}
              <StatusBadge status={currentStatus} size="sm" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Created on {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : 'Recent'}
            </p>
          </div>
        </div>

        {/* User Role Indicator */}
        <div className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Viewing as: </span>
          <strong className="text-white font-mono">
            {isBuyer ? 'Buyer (Depositor)' : isSeller ? 'Seller (Beneficiary)' : account ? formatAddress(account) : 'Observer (Not Connected)'}
          </strong>
        </div>
      </div>

      {/* Main Status & Action Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Visual Milestone Stepper */}
        <div className="pb-6 border-b border-slate-800/80">
          <div className="grid grid-cols-4 gap-2 text-center">
            {steps.map((step, idx) => {
              const state = getStepState(step.key);
              let iconColor = 'text-slate-600 border-slate-800 bg-slate-950';
              let textColor = 'text-slate-500';

              if (state === 'completed') {
                iconColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
                textColor = 'text-slate-200 font-semibold';
              } else if (state === 'active') {
                iconColor = 'text-cyan-400 border-cyan-500/50 bg-cyan-950/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]';
                textColor = 'text-cyan-300 font-bold';
              } else if (state === 'disputed') {
                iconColor = 'text-rose-400 border-rose-500/50 bg-rose-950/60';
                textColor = 'text-rose-300 font-semibold';
              }

              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-mono mb-2 transition-all ${iconColor}`}>
                    {state === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] sm:text-xs ${textColor}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                currentStatus === 'Completed'
                  ? 'w-full bg-emerald-400'
                  : currentStatus === 'Delivered'
                  ? 'w-3/4 bg-cyan-400'
                  : currentStatus === 'In Progress' || currentStatus === 'Created'
                  ? 'w-1/2 bg-amber-400'
                  : currentStatus === 'Disputed'
                  ? 'w-2/3 bg-rose-500'
                  : 'w-1/4 bg-slate-600'
              }`}
            />
          </div>
        </div>

        {/* Escrow Details Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {transaction.description}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              <strong>Delivery Specifications:</strong> {transaction.delivery_terms || transaction.deliveryTerms || 'Payment released upon milestone review and inspection.'}
            </p>
            {onChainTx && (
              <div className="text-[11px] font-mono text-cyan-400 pt-1 flex items-center gap-2">
                <span>Smart Contract Balance: {onChainTx.amount} ETH</span>
                <span>• State: {onChainTx.statusText}</span>
              </div>
            )}
          </div>

          <div className="sm:text-right shrink-0 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Escrow Deposit
            </span>
            <div className="text-2xl font-bold font-mono text-white">
              {transaction.amount} <span className="text-cyan-400 text-sm">{transaction.currency || 'ETH'}</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 sm:justify-end">
              <Lock className="w-3 h-3" />
              <span>Smart Contract Locked</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400">Current Protocol Action:</span>
            <div className="text-sm font-semibold text-white mt-0.5">
              {(currentStatus === 'In Progress' || currentStatus === 'Created') && (
                isSeller ? 'Awaiting your deliverable submission.' : 'Funds locked in contract. Awaiting seller delivery.'
              )}
              {currentStatus === 'Delivered' && (
                isBuyer ? 'Seller marked as delivered. Verify deliverables and confirm completion.' : 'Delivered. Awaiting buyer confirmation or inspection period expiry.'
              )}
              {currentStatus === 'Completed' && 'Settlement complete. Funds disbursed to seller.'}
              {currentStatus === 'Disputed' && 'Escrow locked under arbitration. Evidence submitted to arbitrator.'}
              {currentStatus === 'Refunded' && 'Order canceled. Funds refunded to buyer.'}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect MetaMask to Interact</span>
              </button>
            ) : !isCorrectNetwork ? (
              <button
                onClick={switchToTargetNetwork}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Switch Network</span>
              </button>
            ) : (
              <>
                {onChainTx && ['Created', 'Disputed'].includes(currentStatus) && Date.now() >= (currentStatus === 'Created' ? onChainTx.createdAt : onChainTx.updatedAt).getTime() + 30 * 86400000 && (
                  <button disabled={actionLoading} className="px-4 py-2 rounded-xl bg-amber-600 text-white" onClick={async () => {
                    setActionLoading(true);
                    try { await contracts.refundExpiredOnChain(transaction.on_chain_tx_id); await loadTransactionData(); }
                    catch (err) { setError(err.shortMessage || err.message); }
                    finally { setActionLoading(false); }
                  }}>Refund expired escrow</button>
                )}
                {/* Seller Action: Mark as Delivered */}
                {isSeller && (currentStatus === 'In Progress' || currentStatus === 'Created') && (
                  <button
                    onClick={() => setShowDeliveryModal(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Mark as Delivered</span>
                  </button>
                )}

                {/* Buyer Action: Confirm Completion */}
                {(isBuyer || (onChainTx && Date.now() >= onChainTx.updatedAt.getTime() + onChainTx.inspectionDays * 86400000)) && currentStatus === 'Delivered' && (
                  <button
                    onClick={handleConfirmCompletion}
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Completion & Release Escrow</span>
                  </button>
                )}

                {/* Either Party: Raise Dispute */}
                {(currentStatus === 'In Progress' || currentStatus === 'Delivered' || currentStatus === 'Created') && (
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Raise Dispute</span>
                  </button>
                )}

                {/* Completed state: Rate counterpart */}
                {currentStatus === 'Completed' && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Rate Reputation</span>
                  </button>
                )}

                {/* Arbitrator portal link if disputed */}
                {currentStatus === 'Disputed' && (
                  <Link
                    to="/disputes"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>View in Arbitrator Portal</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Counterparties Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Buyer Profile Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Buyer (Depositor)</span>
            </span>
            <ReputationBadge score={buyerRepScore} size="sm" />
          </div>

          <div>
            <Link to={`/profile/${transaction.buyer_wallet}`} className="text-sm font-bold text-white hover:text-cyan-300 transition">
              {buyerProfile?.user?.display_name || formatAddress(transaction.buyer_wallet)}
            </Link>
            <div className="text-xs font-mono text-slate-400 mt-0.5 break-all">
              {transaction.buyer_wallet}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            <div className="p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400 block text-[10px]">Completed Deals:</span>
              <strong className="text-white font-mono">{buyerProfile?.reputation?.completed_transactions || 0}</strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400 block text-[10px]">Avg Rating:</span>
              <strong className="text-emerald-400 font-mono">
                {buyerProfile?.reputation?.average_rating ? `${buyerProfile.reputation.average_rating} ★` : 'No ratings yet'}
              </strong>
            </div>
          </div>
        </div>

        {/* Seller Profile Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Seller (Provider)</span>
            </span>
            <ReputationBadge score={sellerRepScore} size="sm" />
          </div>

          <div>
            <Link to={`/profile/${transaction.seller_wallet}`} className="text-sm font-bold text-white hover:text-cyan-300 transition">
              {sellerProfile?.user?.display_name || formatAddress(transaction.seller_wallet)}
            </Link>
            <div className="text-xs font-mono text-slate-400 mt-0.5 break-all">
              {transaction.seller_wallet}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            <div className="p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400 block text-[10px]">Completed Deals:</span>
              <strong className="text-white font-mono">{sellerProfile?.reputation?.completed_transactions || 0}</strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400 block text-[10px]">Avg Rating:</span>
              <strong className="text-emerald-400 font-mono">
                {sellerProfile?.reputation?.average_rating ? `${sellerProfile.reputation.average_rating} ★` : 'No ratings yet'}
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* Dispute & Evidence Section (If Disputed) */}
      {currentStatus === 'Disputed' && (
        <div className="rounded-3xl border border-rose-500/40 bg-slate-900/80 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 text-rose-400 pb-4 border-b border-rose-950">
            <ShieldAlert className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold text-white">Dispute Active — Arbitrator Review Required</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Status: <span className="font-semibold text-rose-300">{disputeRecord?.status || 'Open'}</span>
                {disputeRecord?.raised_by && ` • Raised by: ${formatAddress(disputeRecord.raised_by)}`}
              </p>
            </div>
          </div>

          {/* Submitted Evidence Feeds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Buyer Evidence */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Buyer Claims & Evidence
              </h4>
              {disputeRecord?.evidence_buyer ? (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="font-mono text-cyan-400">Buyer Submission</span>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap">{disputeRecord.evidence_buyer}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No buyer evidence recorded yet.</p>
              )}
            </div>

            {/* Seller Evidence */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Seller Response & Defense
              </h4>
              {disputeRecord?.evidence_seller ? (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="font-mono text-emerald-400">Seller Submission</span>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap">{disputeRecord.evidence_seller}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No seller response recorded yet.</p>
              )}
            </div>

          </div>

          {/* Submit New Evidence Form for either party */}
          {isParty && (
            <form onSubmit={handleAddEvidence} className="pt-4 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-200">
                Submit Additional Evidence (as {isBuyer ? 'Buyer' : 'Seller'})
              </label>
              <textarea
                rows={2}
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                placeholder="Enter log snippets, commit hashes, or clarification for the arbitrator..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="Optional attachment reference"
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-300 placeholder-slate-600 focus:outline-none w-64"
                />
                <button
                  type="submit"
                  disabled={evidenceSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{evidenceSubmitting ? 'Attaching...' : 'Attach Evidence to Case'}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      )}

      {/* On-Chain Audit Details */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Smart Contract Verification</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">On-Chain Escrow ID</span>
            <span className="text-white font-bold">
              {transaction.on_chain_tx_id !== null && transaction.on_chain_tx_id !== undefined ? `#${transaction.on_chain_tx_id}` : 'Pending chain synchronization'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">Current Settlement Status</span>
            <span className="text-cyan-300 font-bold">{currentStatus}</span>
          </div>
        </div>

        {transaction.tx_hash && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="truncate mr-2">Tx Hash: {transaction.tx_hash}</span>
            <a
              href={`https://amoy.polygonscan.com/tx/${transaction.tx_hash}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0"
            >
              <span>Polygonscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Mark Delivered Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Submit Proof of Delivery</h3>
            <p className="text-xs text-slate-300">
              Provide delivery details, GitHub commit hash, Figma link, or IPFS CID for buyer review.
            </p>
            <form onSubmit={handleDeliverySubmit} className="space-y-4">
              <textarea
                rows={3}
                required
                value={deliveryProofInput}
                onChange={(e) => setDeliveryProofInput(e.target.value)}
                placeholder="e.g. Pull Request #14 merged on repository, test report attached..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Confirming in MetaMask...' : 'Submit on Chain & Start Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        onConfirm={handleDisputeSubmit}
        txId={transaction.id}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
        recipientAddress={isBuyer ? transaction.seller_wallet : transaction.buyer_wallet}
        recipientName={isBuyer ? (sellerProfile?.user?.display_name || formatAddress(transaction.seller_wallet)) : (buyerProfile?.user?.display_name || formatAddress(transaction.buyer_wallet))}
        txId={transaction.id}
      />

      {/* Real Web3 Pending Action Notification */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/50 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center mx-auto text-cyan-400">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>

            <h3 className="text-lg font-bold text-white">
              Smart Contract Interaction
            </h3>

            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              {pendingAction.message}
            </p>

            <div className="py-2">
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-1.5 animate-pulse w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
