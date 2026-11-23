import React from 'react';
import { Shield, Lock, CheckCircle2, Scale, Star, X, ArrowRight } from 'lucide-react';

export const HowItWorksModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900/95 p-6 sm:p-8 shadow-2xl relative text-left">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">How TrustChain Works</h3>
            <p className="text-xs text-slate-400">Decentralized Escrow & On-Chain Reputation Protocol</p>
          </div>
        </div>

        {/* 4 Clear Step Pillars */}
        <div className="space-y-3.5 mb-6 text-xs leading-relaxed">
          
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">1. Autonomous Escrow Deposit</h4>
              <p className="text-slate-300 mt-0.5">
                The buyer initiates an agreement by locking funds directly into a non-custodial smart contract vault. Assets remain securely frozen until agreed milestones are satisfied.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">2. Inspect & Confirm Completion</h4>
              <p className="text-slate-300 mt-0.5">
                Once the seller marks deliverables as delivered, the buyer enters the inspection window. With one click, the buyer confirms completion and instantly releases funds.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400 shrink-0 mt-0.5">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">3. Transparent Dispute Court</h4>
              <p className="text-slate-300 mt-0.5">
                If deliverables do not meet agreed terms, either party can raise a dispute. A designated arbitrator examines submitted evidence and executes a binding on-chain ruling.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-800/60 text-amber-400 shrink-0 mt-0.5">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">4. Tamper-Proof Reputation Scoring</h4>
              <p className="text-slate-300 mt-0.5">
                Every release updates on-chain and off-chain reputation scores. Good actors build verifiable trust capital, while defaulting parties incur algorithmic penalty points.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Action */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Powered by Ethereum / Polygon smart contracts
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Got it, let's explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
