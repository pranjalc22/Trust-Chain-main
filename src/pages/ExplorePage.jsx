import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { ProfileSummaryCard } from '../components/cards/ProfileSummaryCard';
import {
  Search,
  Users,
  ShieldCheck,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

export const ExplorePage = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAllUsers();
      if (res && res.users) {
        // Fetch detailed profile for first few users to get score
        const detailedUsers = await Promise.all(
          res.users.map(async (u) => {
            try {
              const prof = await api.getUserProfile(u.wallet_address);
              return {
                ...u,
                reputationScore: prof.reputation?.calculated_score ?? 80,
                completedTransactions: prof.reputation?.completed_transactions ?? 0,
                averageRating: prof.reputation?.average_rating ?? 5.0,
                disputesWon: prof.reputation?.disputes_won ?? 0,
                disputesLost: prof.reputation?.disputes_lost ?? 0,
              };
            } catch {
              return {
                ...u,
                reputationScore: 80,
                completedTransactions: 0,
                averageRating: 5.0,
                disputesWon: 0,
                disputesLost: 0,
              };
            }
          })
        );
        setUsers(detailedUsers);
      }
    } catch (err) {
      console.error('Failed to load users for directory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch the directory on mount; state must be seeded from the API.
    // eslint-disable-next-line react/set-state-in-effect
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const addr = (u.wallet_address || u.walletAddress || '').toLowerCase();
      const name = (u.display_name || u.name || '').toLowerCase();
      const bio = (u.bio || '').toLowerCase();

      if (activeFilter === 'Top Rated' && (u.reputationScore < 85)) return false;
      if (activeFilter === 'Active' && (u.completedTransactions === 0)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return addr.includes(q) || name.includes(q) || bio.includes(q);
      }

      return true;
    });
  }, [users, activeFilter, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query.startsWith('0x') && query.length === 42) {
      navigate(`/profile/${query}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Search Header Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-navy-850 p-6 sm:p-10 shadow-xl text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verifiable Web3 Counterparty Directory</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Explore & Verify Wallet Reputation
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Inspect any wallet address's on-chain settlement track record, dispute history, and verified peer reviews before locking funds.
        </p>

        {/* Big Search Input */}
        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-2">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-cyan-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by wallet address (0x...) or participant name..."
              className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner font-mono"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Lookup
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Tip: Type any 42-char address (0x...) and press Enter or Lookup to open their live reputation profile.
          </p>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['All', 'Top Rated', 'Active'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeFilter === filter
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            {filteredUsers.length} participants registered
          </span>
          <button
            onClick={loadUsers}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-56 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-800 rounded w-28" />
                  <div className="h-3 bg-slate-800/60 rounded w-20" />
                </div>
              </div>
              <div className="h-3 bg-slate-800/50 rounded w-full" />
              <div className="grid grid-cols-3 gap-2 pt-4">
                <div className="h-10 bg-slate-800/40 rounded-lg" />
                <div className="h-10 bg-slate-800/40 rounded-lg" />
                <div className="h-10 bg-slate-800/40 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((u) => (
            <ProfileSummaryCard key={u.wallet_address || u.walletAddress} user={u} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl border border-slate-800 bg-slate-900/30">
          <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">No participants found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? `No profile matched your search query "${searchQuery}".` : 'No participants found under this filter.'}
          </p>
          {searchQuery.startsWith('0x') && searchQuery.length === 42 && (
            <div className="mt-4">
              <button
                onClick={() => navigate(`/profile/${searchQuery}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                <span>Inspect New Address {searchQuery.slice(0, 8)}...</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
