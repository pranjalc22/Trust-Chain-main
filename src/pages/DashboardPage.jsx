import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useEscrow } from '../context/EscrowContext';
import { TransactionCard } from '../components/cards/TransactionCard';
import { StatCard } from '../components/cards/StatCard';
import { ReputationBadge } from '../components/common/ReputationBadge';
import {
  PlusCircle,
  Layers,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Wallet,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const DashboardPage = () => {
  const { account, balance, isConnected, isConnecting, connectWallet, formatAddress } = useWallet();
  const { fetchUserTransactions, fetchLiveReputation } = useEscrow();

  const [transactions, setTransactions] = useState([]);
  const [reputationData, setReputationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch transactions and reputation for current user
  const loadDashboardData = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      const [txList, rep] = await Promise.all([
        fetchUserTransactions(account),
        fetchLiveReputation(account).catch(() => null)
      ]);
      setTransactions(Array.isArray(txList) ? txList : []);
      if (rep) setReputationData(rep);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to fetch data from backend. Ensure backend server is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }, [account, fetchUserTransactions, fetchLiveReputation]);

  useEffect(() => {
    if (account) {
      // Load the user's dashboard data when the account changes.
      // eslint-disable-next-line react/set-state-in-effect
      loadDashboardData();
    } else {
      setTransactions([]);
      setReputationData(null);
    }
  }, [account, loadDashboardData]);

  // Compute metrics from real transactions
  const activeTransactions = useMemo(() => {
    return transactions.filter(t => ['Created', 'In Progress', 'Delivered'].includes(t.status));
  }, [transactions]);

  const completedTransactions = useMemo(() => {
    return transactions.filter(t => t.status === 'Completed');
  }, [transactions]);

  const disputedTransactions = useMemo(() => {
    return transactions.filter(t => t.status === 'Disputed');
  }, [transactions]);

  const totalLockedValue = useMemo(() => {
    return activeTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  }, [activeTransactions]);

  // Tab filtering & search
  const filteredTransactions = useMemo(() => {
    const userAddr = account ? account.toLowerCase() : '';
    return transactions.filter(t => {
      const buyer = (t.buyer_wallet || t.buyer || '').toLowerCase();
      const seller = (t.seller_wallet || t.seller || '').toLowerCase();

      if (activeTab === 'As Buyer' && buyer !== userAddr) return false;
      if (activeTab === 'As Seller' && seller !== userAddr) return false;
      if (['In Progress', 'Delivered', 'Completed', 'Disputed', 'Created'].includes(activeTab)) {
        if (t.status !== activeTab) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = String(t.id).toLowerCase().includes(q) || String(t.on_chain_tx_id || '').toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchBuyer = buyer.includes(q);
        const matchSeller = seller.includes(q);
        return matchId || matchDesc || matchBuyer || matchSeller;
      }

      return true;
    });
  }, [transactions, activeTab, searchQuery, account]);

  const userAddr = account ? account.toLowerCase() : '';
  const filterTabs = [
    { id: 'All', label: 'All Contracts', count: transactions.length },
    { id: 'As Buyer', label: 'As Buyer', count: transactions.filter(t => (t.buyer_wallet || t.buyer || '').toLowerCase() === userAddr).length },
    { id: 'As Seller', label: 'As Seller', count: transactions.filter(t => (t.seller_wallet || t.seller || '').toLowerCase() === userAddr).length },
    { id: 'In Progress', label: 'In Progress', count: transactions.filter(t => t.status === 'In Progress').length },
    { id: 'Delivered', label: 'Delivered', count: transactions.filter(t => t.status === 'Delivered').length },
    { id: 'Completed', label: 'Completed', count: transactions.filter(t => t.status === 'Completed').length },
    { id: 'Disputed', label: 'Disputed', count: transactions.filter(t => t.status === 'Disputed').length }
  ];

  // If not connected
  if (!isConnected || !account) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/10">
          <Wallet className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Connect Your Wallet</h1>
        <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
          Connect MetaMask to view your active escrow agreements, dispute records, and trust score on the TrustChain protocol.
        </p>
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
        >
          <Wallet className="w-4 h-4" />
          <span>{isConnecting ? 'Connecting MetaMask...' : 'Connect MetaMask'}</span>
        </button>
      </div>
    );
  }

  const liveRepScore = reputationData?.on_chain_score ?? 80;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner: User Identity, Balance, and Actions */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-navy-850 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-semibold">
                Connected: {formatAddress(account)}
              </span>
              <ReputationBadge score={liveRepScore} />
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Web3 Escrow Dashboard
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1 rounded-lg border border-slate-800">
                <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-200">{account}</span>
              </span>
              <span className="bg-slate-950/60 px-3 py-1 rounded-lg border border-slate-800 text-slate-300">
                Balance: <strong className="text-cyan-400">{balance}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/create"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Transaction</span>
            </Link>

            <Link
              to={`/profile/${account}`}
              className="px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>View Reputation</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Escrows"
          value={activeTransactions.length}
          subtext="Locked in smart contract vault"
          icon={Lock}
          color="cyan"
        />
        <StatCard
          title="Escrowed Value"
          value={`${totalLockedValue.toFixed(3)} ETH`}
          subtext="Currently secured in escrow"
          icon={Layers}
          color="purple"
        />
        <StatCard
          title="Completed Settled"
          value={completedTransactions.length}
          subtext="Successful disbursements"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Open Disputes"
          value={disputedTransactions.length}
          subtext="Under arbitrator review"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Main Transactions Section */}
      <div className="space-y-4">
        
        {/* Header with Search and Refresh */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Escrow Transactions
            </h2>
            <p className="text-xs text-slate-400">
              Live settlement status synchronized between Hardhat/Polygon and TrustChain API
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tx ID or terms..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={loadDashboardData}
              disabled={loading}
              title="Refresh transactions from backend"
              className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error notification if backend failed */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 flex items-center justify-between text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="underline hover:text-rose-200 font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                activeTab === tab.id ? 'bg-cyan-900/60 text-cyan-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Transactions List / Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-800 rounded w-28" />
                  <div className="h-5 bg-slate-800 rounded-full w-20" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                </div>
                <div className="pt-3 border-t border-slate-800/60 flex justify-between items-center">
                  <div className="h-4 bg-slate-800 rounded w-36" />
                  <div className="h-7 bg-slate-800 rounded-lg w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTransactions.map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 rounded-3xl border border-slate-800/60 bg-slate-900/30">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500 mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No transactions found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery ? `No matches for "${searchQuery}". Try a different search term.` : 'No transactions recorded under this filter yet.'}
            </p>
            <div className="mt-4">
              <Link
                to="/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create New Escrow</span>
              </Link>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
