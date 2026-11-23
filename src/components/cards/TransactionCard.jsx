import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import { useWallet } from '../../context/WalletContext';
import { ArrowRight, Clock } from 'lucide-react';

export const TransactionCard = ({ transaction }) => {
  const { account, formatAddress } = useWallet();

  if (!transaction) return null;

  // Support both backend snake_case and frontend camelCase
  const id = transaction.id;
  const buyer = transaction.buyer_wallet || transaction.buyer || '';
  const seller = transaction.seller_wallet || transaction.seller || '';
  const amount = transaction.amount || '0';
  const currency = transaction.currency || 'ETH';
  const status = transaction.status || 'Created';
  const description = transaction.description || 'Escrow Transaction';
  const onChainTxId = transaction.on_chain_tx_id ?? transaction.onChainTxId;
  const createdAt = transaction.created_at || transaction.createdAt || '';

  const userAddr = account ? account.toLowerCase() : '';
  const isBuyer = userAddr && buyer.toLowerCase() === userAddr;
  const isSeller = userAddr && seller.toLowerCase() === userAddr;
  
  const counterpartyAddress = isBuyer ? seller : buyer;
  const counterpartyRole = isBuyer ? 'Seller' : (isSeller ? 'Buyer' : 'Counterparty');

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Recent';

  return (
    <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 hover:bg-slate-900 transition-all duration-200 shadow-lg hover:shadow-cyan-500/5">
      
      {/* Top row: ID, Created Date, Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            #{id} {onChainTxId !== null && onChainTxId !== undefined && `(Chain #${onChainTxId})`}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            {formattedDate}
          </span>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Middle row: Description & Amount */}
      <div className="my-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
              {description}
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {transaction.delivery_terms || transaction.deliveryTerms || (isBuyer ? `Purchasing from ${formatAddress(seller)}` : `Selling to ${formatAddress(buyer)}`)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold font-mono text-white">
              {amount} <span className="text-xs text-cyan-400">{currency}</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              In Escrow
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: Counterparty info & Link button */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-[10px]">
            {counterpartyRole[0]}
          </div>
          <div>
            <span className="text-slate-400">{counterpartyRole}: </span>
            <span className="text-slate-200 font-mono font-medium">
              {formatAddress(counterpartyAddress)}
            </span>
          </div>
        </div>

        <Link
          to={`/transaction/${id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 font-medium transition-all group/btn"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
