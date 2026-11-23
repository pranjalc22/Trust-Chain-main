import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useEscrow } from '../../context/EscrowContext';
import * as api from '../../services/api';
import { HowItWorksModal } from '../modals/HowItWorksModal';
import {
  Shield,
  Layers,
  PlusCircle,
  Search,
  Scale,
  User,
  Wallet,
  Check,
  Copy,
  ChevronDown,
  Menu,
  X,
  HelpCircle,
  RotateCcw,
  RefreshCw
} from 'lucide-react';

export const Navbar = () => {
  const {
    account,
    isConnected,
    isConnecting,
    network,
    balance,
    connectWallet,
    disconnectWallet,
    formatAddress,
    isCorrectNetwork,
    targetNetworkName,
  } = useWallet();

  const { fetchOpenDisputes, showToast } = useEscrow();
  const location = useLocation();

  const [copied, setCopied] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [disputeCount, setDisputeCount] = useState(0);

  // How it works modal state
  const [howItWorksOpen, setHowItWorksOpen] = useState(() => {
    return !localStorage.getItem('trustchain_howitworks_seen');
  });

  // Reset demo modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Check open disputes count periodically
  useEffect(() => {
    let isMounted = true;
    const loadDisputes = async () => {
      try {
        const disputes = await fetchOpenDisputes();
        if (isMounted && Array.isArray(disputes)) {
          setDisputeCount(disputes.length);
        }
      } catch {
        // quiet ignore in navbar
      }
    };
    loadDisputes();
    const interval = setInterval(loadDisputes, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchOpenDisputes]);

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseHowItWorks = () => {
    setHowItWorksOpen(false);
    localStorage.setItem('trustchain_howitworks_seen', 'true');
  };

  const handleResetDemoData = async () => {
    setIsResetting(true);
    try {
      await api.resetDemoData();
      showToast('Demo Data Reset', 'Fresh test accounts and transactions reloaded successfully!', 'success');
      setResetModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      console.error('Demo reset error:', err);
      showToast('Reset Failed', err.message || 'Could not reset demo data from backend.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Layers },
    { path: '/create', label: 'Create Escrow', icon: PlusCircle },
    { path: '/explore', label: 'Explore & Search', icon: Search },
    { 
      path: '/disputes', 
      label: 'Arbitration', 
      icon: Scale,
      badge: disputeCount > 0 ? disputeCount : null 
    },
    ...(account ? [{ path: `/profile/${account}`, label: 'My Reputation', icon: User }] : [])
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Brand / Logo */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    TrustChain
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono font-bold">
                    Demo
                  </span>
                </div>
                <span className="hidden sm:block text-[10px] text-slate-400 font-medium -mt-1 tracking-wider uppercase">
                  Decentralized Escrow & Reputation
                </span>
              </div>
            </Link>

            {/* Center Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path.startsWith('/profile') && location.pathname.startsWith('/profile'));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Controls: How it Works, Reset Demo, Network & Wallet */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* How it works info button */}
              <button
                onClick={() => setHowItWorksOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs text-slate-300 font-medium transition cursor-pointer"
                title="How TrustChain works summary"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>How It Works</span>
              </button>

              {/* Reset Demo Data button */}
              <button
                onClick={() => setResetModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-800/40 bg-purple-950/30 hover:bg-purple-900/50 text-xs text-purple-300 font-medium transition cursor-pointer"
                title="Reset demo data to initial state"
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                <span>Reset Demo</span>
              </button>

              {/* Network pill */}
              {isConnected && (
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono ${
                  isCorrectNetwork
                    ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                    : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{isCorrectNetwork ? (network || targetNetworkName) : 'Wrong Network'}</span>
                </div>
              )}

              {/* Wallet Connect / Account button */}
              {isConnected && account ? (
                <div className="relative">
                  <button
                    onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 hover:border-cyan-500/50 text-xs font-mono text-slate-200 transition shadow-sm cursor-pointer"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-cyan-300">{balance}</span>
                    <span className="text-slate-400">|</span>
                    <span>{formatAddress(account)}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {walletDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-3 z-50 animate-in fade-in duration-100">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                        <span className="text-slate-400">Connected Wallet</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      </div>

                      <div className="my-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[11px] text-slate-400">Address</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-mono text-xs text-white break-all">
                            {account}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={copyAddress}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                          <Link
                            to={`/profile/${account}`}
                            onClick={() => setWalletDropdownOpen(false)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 hover:bg-cyan-900/60 transition"
                          >
                            <User className="w-3 h-3" />
                            <span>View Profile</span>
                          </Link>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs py-1 px-1">
                        <span className="text-slate-400">Balance:</span>
                        <span className="font-bold text-cyan-400">{balance}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs py-1 px-1">
                        <span className="text-slate-400">Network:</span>
                        <span className={isCorrectNetwork ? 'text-slate-200' : 'text-amber-400 font-bold'}>
                          {network || targetNetworkName}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800 space-y-1.5">
                        <button
                          onClick={() => {
                            setResetModalOpen(true);
                            setWalletDropdownOpen(false);
                          }}
                          className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-purple-300 hover:bg-purple-950/40 border border-purple-900/40 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Demo Database</span>
                        </button>
                        <button
                          onClick={() => {
                            disconnectWallet();
                            setWalletDropdownOpen(false);
                          }}
                          className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 border border-rose-900/30 transition text-center cursor-pointer"
                        >
                          Disconnect Wallet
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                </button>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-slate-800 space-y-2">
              <div className="flex gap-2 px-2 pb-2 border-b border-slate-800">
                <button
                  onClick={() => {
                    setHowItWorksOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>How It Works</span>
                </button>
                <button
                  onClick={() => {
                    setResetModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-purple-950/40 border border-purple-800/40 text-xs text-purple-300 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                  <span>Reset Demo</span>
                </button>
              </div>

              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={howItWorksOpen}
        onClose={handleCloseHowItWorks}
      />

      {/* Reset Demo Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-purple-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-purple-400">
              <div className="p-2.5 rounded-xl bg-purple-950 border border-purple-800/60">
                <RotateCcw className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reset Demo Database?</h3>
                <p className="text-xs text-slate-400">Repeatable College Demo Mode</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will restore standard test accounts (Alice, Bob, Carol) with fresh sample transactions in each status state (In Progress, Delivered, Completed, Disputed).
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDemoData}
                disabled={isResetting}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting Database...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
