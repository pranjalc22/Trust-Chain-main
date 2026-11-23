import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useEscrow } from '../context/EscrowContext';
import * as api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Scale,
  FileText,
  CheckCircle2,
  Gavel,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DisputeArbitratorPage = () => {
  const { account, formatAddress, isConnected, connectWallet, isCorrectNetwork, switchToTargetNetwork } = useWallet();
  const { resolveDispute, pendingAction } = useEscrow();

  const [disputes, setDisputes] = useState([]);
  const [selectedDisputeId, setSelectedDisputeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState(null);

  const [verdictModal, setVerdictModal] = useState(null); // { dispute, decision: 'release_to_seller' | 'refund_to_buyer' }
  const [arbiterNotes, setArbiterNotes] = useState('');

  // Fetch all open disputes from backend
  const loadDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOpenDisputes();
      const list = res.disputes || [];
      setDisputes(list);
      if (list.length > 0 && !selectedDisputeId) {
        setSelectedDisputeId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load disputes:', err);
      setError('Failed to fetch open disputes from backend.');
    } finally {
      setLoading(false);
    }
  }, [selectedDisputeId]);

  useEffect(() => {
    // Poll/refresh the dispute queue on mount and when selection changes.
    // eslint-disable-next-line react/set-state-in-effect
    loadDisputes();
  }, [loadDisputes]);

  const activeDispute = disputes.find(d => d.id === selectedDisputeId) || (disputes.length > 0 ? disputes[0] : null);
  const activeTx = activeDispute?.transaction;

  const handleConfirmVerdict = async () => {
    if (!verdictModal || !activeTx) return;
    setResolving(true);
    try {
      await resolveDispute(
        activeTx.id,
        activeTx.on_chain_tx_id,
        verdictModal.dispute.id,
        verdictModal.decision,
        arbiterNotes
      );
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
      setVerdictModal(null);
      setArbiterNotes('');
      await loadDisputes();
    } catch (err) {
      console.error('Resolution failed:', err);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Arbitrator Portal Header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-navy-850 to-slate-900 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/60 text-purple-300 text-xs font-semibold">
              <Scale className="w-3.5 h-3.5" />
              <span>Decentralized Dispute Court</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Arbitrator Resolution Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Review submitted claims, audit logs, and render cryptographic verdicts on-chain. 
              Arbitration decisions immediately release or refund escrowed assets.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Open Disputes:</span>
              <span className="font-bold text-rose-400 font-mono text-sm">{disputes.length}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Connected Wallet:</span>
              <span className="font-mono text-cyan-300">{account ? formatAddress(account) : 'Not Connected'}</span>
            </div>
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Connect MetaMask
              </button>
            ) : !isCorrectNetwork ? (
              <button
                onClick={switchToTargetNetwork}
                className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Switch Network
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
          <div className="lg:col-span-4 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="h-4 bg-slate-800 rounded w-28" />
                <div className="h-4 bg-slate-800/60 rounded w-full" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-8 h-96 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 space-y-6">
            <div className="h-6 bg-slate-800 rounded w-1/3" />
            <div className="h-16 bg-slate-800/60 rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-slate-800/40 rounded-2xl" />
              <div className="h-24 bg-slate-800/40 rounded-2xl" />
            </div>
          </div>
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl border border-slate-800 bg-slate-900/40">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">All Disputes Settled</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            There are currently no active disputes in the protocol queue. All contracts are in healthy settlement states.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Dispute Cases Queue */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Cases ({disputes.length})
              </h2>
              <button
                onClick={loadDisputes}
                className="text-slate-400 hover:text-white p-1"
                title="Refresh disputes"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {disputes.map((disp) => {
                const tx = disp.transaction;
                const isSelected = activeDispute?.id === disp.id;
                return (
                  <button
                    key={disp.id}
                    onClick={() => setSelectedDisputeId(disp.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-rose-500/60 shadow-lg shadow-rose-500/5'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        Dispute #{disp.id} (Tx #{tx?.id})
                      </span>
                      <StatusBadge status="Disputed" size="sm" />
                    </div>
                    <div className="text-sm font-semibold text-white line-clamp-1">
                      {tx?.description || 'Escrow Agreement'}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-mono">
                      <span>{tx?.amount} {tx?.currency || 'ETH'}</span>
                      <span>{disp.created_at ? new Date(disp.created_at).toLocaleDateString() : 'Recent'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Case Details & Evidence Inspection */}
          <div className="lg:col-span-8">
            {activeDispute && activeTx ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl space-y-6">
                
                {/* Case Title & Escrowed Amount */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold font-mono text-white">Case #{activeDispute.id}</h3>
                      <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/40">
                        Escrow #{activeTx.id} {activeTx.on_chain_tx_id !== null && activeTx.on_chain_tx_id !== undefined && `(Chain #${activeTx.on_chain_tx_id})`}
                      </span>
                      <StatusBadge status="Disputed" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-200 mt-1">
                      {activeTx.description}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Terms: {activeTx.delivery_terms || activeTx.deliveryTerms || 'Standard inspection terms'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Locked Deposit</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">{activeTx.amount} {activeTx.currency || 'ETH'}</span>
                  </div>
                </div>

                {/* Disputant Parties Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Buyer */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold uppercase text-[10px]">Buyer (Depositor)</span>
                      <span className="text-cyan-400 font-mono text-[10px]">Complainant</span>
                    </div>
                    <div className="font-mono text-slate-200 text-xs break-all">{activeTx.buyer_wallet || activeTx.buyer}</div>
                  </div>

                  {/* Seller */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold uppercase text-[10px]">Seller (Beneficiary)</span>
                      <span className="text-emerald-400 font-mono text-[10px]">Respondent</span>
                    </div>
                    <div className="font-mono text-slate-200 text-xs break-all">{activeTx.seller_wallet || activeTx.seller}</div>
                  </div>

                </div>

                {/* Side-by-Side Evidence Inspection */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Evidence Dossier</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Buyer Side Evidence */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <span className="text-xs font-bold text-cyan-400 uppercase">
                        Buyer Claims & Logs
                      </span>
                      {activeDispute.evidence_buyer ? (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                          <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {activeDispute.evidence_buyer}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No buyer evidence provided yet.</p>
                      )}
                    </div>

                    {/* Seller Side Evidence */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <span className="text-xs font-bold text-emerald-400 uppercase">
                        Seller Response & Defense
                      </span>
                      {activeDispute.evidence_seller ? (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                          <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {activeDispute.evidence_seller}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No seller response provided yet.</p>
                      )}
                    </div>

                  </div>
                </div>

                {/* Arbitrator Rulings Actions */}
                <div className="pt-6 border-t border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Gavel className="w-4 h-4 text-purple-400" />
                    <span>Render Binding Verdict:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setVerdictModal({ dispute: activeDispute, decision: 'release_to_seller' })}
                      disabled={resolving}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Rule for SELLER (Release {activeTx.amount} {activeTx.currency || 'ETH'})</span>
                    </button>

                    <button
                      onClick={() => setVerdictModal({ dispute: activeDispute, decision: 'refund_to_buyer' })}
                      disabled={resolving}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Rule for BUYER (Refund {activeTx.amount} {activeTx.currency || 'ETH'})</span>
                    </button>
                  </div>

                  <p className="text-center text-[11px] text-slate-500">
                    Verdicts execute smart contract function <code className="font-mono text-slate-400">resolveDispute(onChainTxId, releaseToSeller)</code> via MetaMask.
                  </p>
                </div>

              </div>
            ) : null}
          </div>

        </div>
      )}

      {/* Verdict Confirmation Modal */}
      {verdictModal && activeTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-purple-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-purple-400">
              <div className="p-2 rounded-xl bg-purple-950 border border-purple-800">
                <Gavel className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Arbitration Verdict</h3>
                <p className="text-xs text-slate-400 font-mono">Dispute #{verdictModal.dispute.id} (Chain #{activeTx.on_chain_tx_id})</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border text-xs font-semibold ${
              verdictModal.decision === 'release_to_seller'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}>
              Verdict: {verdictModal.decision === 'release_to_seller' 
                ? `Release ${activeTx.amount} ${activeTx.currency || 'ETH'} to Seller (${formatAddress(activeTx.seller_wallet || activeTx.seller)})`
                : `Refund ${activeTx.amount} ${activeTx.currency || 'ETH'} to Buyer (${formatAddress(activeTx.buyer_wallet || activeTx.buyer)})`}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Arbitration Judgment Rationale / Contract Notes
              </label>
              <textarea
                rows={3}
                value={arbiterNotes}
                onChange={(e) => setArbiterNotes(e.target.value)}
                placeholder="State the contractual basis for your decision (e.g. deliverable satisfied Section 2, or provider failed to furnish valid test logs)..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVerdictModal(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVerdict}
                disabled={resolving}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {resolving ? 'Confirming in MetaMask...' : 'Execute On-Chain Settlement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Web3 Pending Action Notification */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-purple-500/50 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center mx-auto text-purple-400">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>

            <h3 className="text-lg font-bold text-white">
              Arbitrator Smart Contract Call
            </h3>

            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              {pendingAction.message}
            </p>

            <div className="py-2">
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-400 to-emerald-400 h-1.5 animate-pulse w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
