import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useEscrow } from '../context/EscrowContext';
import * as api from '../services/api';
import { ReputationBadge } from '../components/common/ReputationBadge';
import { RatingStars } from '../components/common/RatingStars';
import { StatCard } from '../components/cards/StatCard';
import { TransactionCard } from '../components/cards/TransactionCard';
import {
  Award,
  CheckCircle2,
  AlertOctagon,
  Calendar,
  ExternalLink,
  PlusCircle,
  Copy,
  Check,
  Star,
  Edit2,
  Save,
  X,
  Wallet
} from 'lucide-react';

export const ProfilePage = () => {
  const { address } = useParams();
  const { account, formatAddress, connectWallet } = useWallet();
  const { fetchLiveReputation } = useEscrow();

  const targetAddress = address || account;

  const [profileData, setProfileData] = useState(null);
  const [liveReputation, setLiveReputation] = useState(null);
  const [userTransactions, setUserTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Edit profile state (display name, bio)
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!targetAddress) return;
    setLoading(true);
    setError(null);
    try {
      const [profileRes, liveRepRes, txRes] = await Promise.all([
        api.getUserProfile(targetAddress).catch(() => null),
        fetchLiveReputation(targetAddress).catch(() => null),
        api.getUserTransactions(targetAddress).catch(() => ({ transactions: [] }))
      ]);

      if (profileRes) {
        setProfileData(profileRes);
        setEditName(profileRes.user?.display_name || '');
        setEditBio(profileRes.user?.bio || '');
      }
      if (liveRepRes) {
        setLiveReputation(liveRepRes);
      }
      if (txRes && txRes.transactions) {
        setUserTransactions(txRes.transactions);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Could not fetch user profile from server.');
    } finally {
      setLoading(false);
    }
  }, [targetAddress, fetchLiveReputation]);

  useEffect(() => {
    // Fetch the profile whenever the target wallet changes.
    // eslint-disable-next-line react/set-state-in-effect
    loadProfile();
  }, [loadProfile]);

  const handleCopy = () => {
    if (targetAddress) {
      navigator.clipboard.writeText(targetAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!targetAddress) return;
    setSavingProfile(true);
    try {
      await api.updateUserProfile(targetAddress, {
        display_name: editName,
        bio: editBio
      });
      setIsEditing(false);
      await loadProfile();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  if (!targetAddress) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center mx-auto text-cyan-400">
          <Wallet className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">No Wallet Connected</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Please connect your MetaMask wallet or view a specific profile address to inspect on-chain reputation.
        </p>
        <button
          onClick={connectWallet}
          className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-pulse">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-2/3">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 shrink-0" />
            <div className="space-y-3 w-full">
              <div className="h-6 bg-slate-800 rounded w-48" />
              <div className="h-4 bg-slate-800/60 rounded w-72" />
              <div className="h-3 bg-slate-800/40 rounded w-full" />
            </div>
          </div>
          <div className="w-32 h-32 rounded-2xl bg-slate-800/80 shrink-0" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4" />
          ))}
        </div>
      </div>
    );
  }

  const isSelf = account && account.toLowerCase() === targetAddress.toLowerCase();

  // Prefer live on-chain score from the contract, then the profile's on-chain
  // snapshot, then the off-chain calculated score.
  const score = liveReputation?.on_chain_score
    ?? profileData?.reputation?.on_chain?.on_chain_score
    ?? profileData?.reputation?.calculated_score
    ?? 80;

  const isLiveFromContract = Boolean(
    liveReputation?.on_chain_score ?? profileData?.reputation?.on_chain?.on_chain_score
  );

  // Radial score gauge
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const user = profileData?.user;
  const reputation = profileData?.reputation;
  const ratingsList = reputation?.recent_ratings || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Profile Header Hero Card */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-navy-850 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          
          {/* Identity & Bio */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border-2 border-slate-700 flex items-center justify-center text-cyan-400 shadow-lg shrink-0 text-xl font-bold font-mono">
              {targetAddress.slice(2, 4).toUpperCase()}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {user?.display_name || formatAddress(targetAddress)}
                </h1>
                <ReputationBadge score={score} size="md" />
                {isLiveFromContract && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800/60 text-emerald-400 font-mono font-semibold">
                    Smart Contract Verified
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                <span className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5 break-all">
                  <span>{targetAddress}</span>
                  <button onClick={handleCopy} className="text-slate-400 hover:text-white cursor-pointer" title="Copy Address">
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
                <span className="text-slate-500">•</span>
                <span className="flex items-center gap-1 text-slate-400 font-sans">
                  <Calendar className="w-3 h-3" /> Registered on TrustChain
                </span>
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="pt-2 space-y-2 max-w-md">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Display Name"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                  <textarea
                    rows={2}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Brief bio about your skills or business..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    {user?.bio || 'Verified participant on the TrustChain decentralized settlement protocol.'}
                  </p>
                  {isSelf && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-slate-400 hover:text-cyan-400 p-1"
                      title="Edit Bio"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Radial Trust Score Gauge */}
          <div className="flex flex-col items-center justify-center shrink-0 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  className={`${score >= 85 ? 'text-emerald-400' : score >= 65 ? 'text-cyan-400' : 'text-amber-400'} transition-all duration-1000`}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold font-mono text-white tracking-tight">{score}</span>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Trust Score</span>
              </div>
            </div>
            
            <span className="text-xs text-slate-300 font-semibold mt-1">
              {score >= 85 ? 'Elite Tier Status' : score >= 65 ? 'Verified Tier' : 'Standard Tier'}
            </span>
          </div>

        </div>

        {/* Action button if viewing another user */}
        {!isSelf && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-end">
            <Link
              to={`/create`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Initiate Escrow With This User</span>
            </Link>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Settled Escrows"
          value={reputation?.completed_transactions ?? 0}
          subtext="Successfully released"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Average Rating"
          value={`${reputation?.average_rating ? reputation.average_rating.toFixed(1) : '5.0'} / 5.0`}
          subtext={`From ${reputation?.total_ratings || 0} reviews`}
          icon={Star}
          color="amber"
        />
        <StatCard
          title="Disputes Won"
          value={reputation?.disputes_won ?? 0}
          subtext="Arbitrated in user favor"
          icon={Award}
          color="cyan"
        />
        <StatCard
          title="Disputes Lost"
          value={reputation?.disputes_lost ?? 0}
          subtext="Default penalties"
          icon={AlertOctagon}
          color="purple"
        />
      </div>

      {/* Ratings & Testimonials Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Verified Settlement Reviews
            </h2>
            <p className="text-xs text-slate-400">
              Live feedback recorded on TrustChain upon escrow release
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            {ratingsList.length} Reviews
          </span>
        </div>

        {ratingsList.length > 0 ? (
          <div className="space-y-3">
            {ratingsList.map((review, i) => (
              <div
                key={review.id || i}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <RatingStars rating={review.stars} size="sm" />
                    <span className="text-xs font-semibold text-white font-mono">
                      {formatAddress(review.from_wallet)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>{review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Recent'}</span>
                    {review.transaction_id && (
                      <Link
                        to={`/transaction/${review.transaction_id}`}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                      >
                        <span>Tx #{review.transaction_id}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  "{review.comment}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center text-xs text-slate-400">
            No public ratings recorded yet for this wallet address. Ratings are automatically requested when an escrow completes.
          </div>
        )}
      </div>

      {/* Transaction History Section */}
      {userTransactions.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Escrow Settlement History
              </h2>
              <p className="text-xs text-slate-400">
                All agreements involving {formatAddress(targetAddress)}
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              {userTransactions.length} Transactions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userTransactions.map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
