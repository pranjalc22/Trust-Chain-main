import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import {
  Shield,
  Lock,
  Award,
  ArrowRight,
  CheckCircle2,
  Users,
  Sparkles
} from 'lucide-react';

export const LandingPage = () => {
  const { isConnected, connectWallet } = useWallet();
  const navigate = useNavigate();

  const handleLaunch = async () => {
    if (!isConnected) {
      await connectWallet();
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-teal-500/10 blur-[110px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            
            {/* Protocol Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Decentralized Escrow & Trust-Weighted Reputation</span>
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              <span className="text-slate-400 font-mono">Polygon Testnet</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Zero Counterparty Risk.{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                True On-Chain Trust.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              <strong>TrustChain</strong> safeguards Web3 commerce through autonomous smart contract escrow 
              and tamper-proof, transaction-weighted reputation scoring. No middlemen, no fraud, no chargebacks.
            </p>

            {/* Call to Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleLaunch}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Launch Demo App</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to="/explore"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Explore Verified Wallets</span>
              </Link>
            </div>

            {/* Web3 Trust Indicators */}
            <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-extrabold text-white font-mono">$1.4M+</div>
                <div className="text-xs text-slate-400 mt-0.5">Escrow Volume Tested</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-cyan-400 font-mono">100%</div>
                <div className="text-xs text-slate-400 mt-0.5">Non-Custodial Vaults</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono">0.08%</div>
                <div className="text-xs text-slate-400 mt-0.5">Dispute Rate</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-purple-400 font-mono">Polygon</div>
                <div className="text-xs text-slate-400 mt-0.5">Sub-Second Finality</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3-Step Escrow Flow Walkthrough */}
      <section className="py-16 bg-slate-950/60 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              How the TrustChain Protocol Works
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Autonomous smart contracts bridge payments and deliverables with verifiable reputation updates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative hover:border-cyan-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-mono font-bold text-base mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                1. Lock Funds in Escrow
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Buyer creates an agreement specifying terms and deposits crypto (MATIC/ETH) into the 
                autonomous smart contract vault. Funds cannot be withdrawn unilaterally.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-cyan-400 font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>Non-Custodial Settlement</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative hover:border-amber-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono font-bold text-base mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                2. Deliver & Inspect
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Seller fulfills the service or delivers assets and marks the contract as delivered. 
                Buyer enters an inspection window to verify quality before release.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-amber-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Proof of Delivery Inspection</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative hover:border-emerald-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-bold text-base mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                3. Settlement & Reputation
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Buyer confirms release, transferring funds to seller instantly. Both parties submit reviews, 
                and the protocol mints updated Trust Scores on-chain.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
                <Award className="w-3.5 h-3.5" />
                <span>On-Chain Trust Accrual</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Two Pillars Feature Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Pillar 1: Escrow Protection */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 relative">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Decentralized Escrow Settlement
              </h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                TrustChain replaces traditional high-fee middlemen with immutable EVM smart contracts. 
                Payment is locked upon agreement and released only when milestones are satisfied.
              </p>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Zero platform custody — funds remain locked inside the contract code</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Automated inspection windows protect buyers from defective delivery</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Neutral DAO arbitration for objective evidence review</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: Verifiable Reputation */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-6">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Transaction-Weighted Reputation
              </h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Unlike web2 platforms with fake reviews, TrustChain reputation is rooted strictly in 
                completed on-chain transactions and verifiable settlement histories.
              </p>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Sybil-resistant scoring weighted by contract volume and completion rates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Public reputation profiles readable by any dApp or counterparty</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Severe score penalties for frivolous disputes and contract defaults</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800/80 bg-slate-950 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-semibold">TrustChain Protocol</span>
            <span>— College Project Frontend MVP</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="hover:text-cyan-400 transition">Dashboard</Link>
            <Link to="/create" className="hover:text-cyan-400 transition">Create Escrow</Link>
            <Link to="/disputes" className="hover:text-cyan-400 transition">Arbitration</Link>
            <Link to="/explore" className="hover:text-cyan-400 transition">Explore</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};
