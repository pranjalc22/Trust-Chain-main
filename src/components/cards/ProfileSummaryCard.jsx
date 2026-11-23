import React from 'react';
import { Link } from 'react-router-dom';
import { ReputationBadge } from '../common/ReputationBadge';
import { RatingStars } from '../common/RatingStars';
import { ArrowUpRight } from 'lucide-react';

export const ProfileSummaryCard = ({ user }) => {
  if (!user) return null;

  const wallet = user.wallet_address || user.walletAddress || '';
  const name = user.display_name || user.name || (wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : 'User');
  const bio = user.bio || 'Verified participant on the TrustChain protocol.';
  const score = user.reputationScore ?? user.calculated_score ?? 80;
  const completed = user.completedTransactions ?? user.completed_transactions ?? 0;
  const rating = user.averageRating ?? user.average_rating ?? 5.0;
  const disputesWon = user.disputesWon ?? user.disputes_won ?? 0;
  const disputesLost = user.disputesLost ?? user.disputes_lost ?? 0;

  const formattedAddr = wallet ? `${wallet.substring(0, 8)}...${wallet.substring(wallet.length - 6)}` : '';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-cyan-500/30 transition shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold font-mono">
              {wallet ? wallet.slice(2, 4).toUpperCase() : 'TC'}
            </div>
            <div>
              <h4 className="text-base font-semibold text-white hover:text-cyan-300 transition">
                <Link to={`/profile/${wallet}`}>{name}</Link>
              </h4>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                {formattedAddr}
              </div>
            </div>
          </div>

          <ReputationBadge score={score} size="sm" />
        </div>

        <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
          {bio}
        </p>
      </div>

      <div>
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-slate-950/60">
            <div className="font-bold text-white font-mono">{completed}</div>
            <div className="text-[10px] text-slate-400">Escrows</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/60">
            <div className="font-bold text-emerald-400 font-mono">{typeof rating === 'number' ? rating.toFixed(1) : rating} ★</div>
            <div className="text-[10px] text-slate-400">Rating</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/60">
            <div className="font-bold text-cyan-400 font-mono">{disputesWon}/{disputesLost}</div>
            <div className="text-[10px] text-slate-400">Won/Lost</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <RatingStars rating={typeof rating === 'number' ? rating : parseFloat(rating) || 5} size="sm" />
          <Link
            to={`/profile/${wallet}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
          >
            <span>View Profile</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
