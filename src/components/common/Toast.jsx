import React from 'react';
import { useEscrow } from '../../context/EscrowContext';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const Toast = () => {
  const { toastMessage } = useEscrow();

  if (!toastMessage) return null;

  const typeConfig = {
    success: {
      border: 'border-emerald-500/50',
      bg: 'bg-slate-900/95 shadow-emerald-500/10',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
    },
    warning: {
      border: 'border-rose-500/50',
      bg: 'bg-slate-900/95 shadow-rose-500/10',
      icon: <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
    },
    info: {
      border: 'border-cyan-500/50',
      bg: 'bg-slate-900/95 shadow-cyan-500/10',
      icon: <Info className="w-5 h-5 text-cyan-400 shrink-0" />
    }
  };

  const current = typeConfig[toastMessage.type] || typeConfig.info;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-short">
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${current.border} ${current.bg} shadow-2xl backdrop-blur-md`}>
        {current.icon}
        <div className="flex-1 text-sm">
          <p className="font-semibold text-slate-100">{toastMessage.title}</p>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toastMessage.message}</p>
        </div>
      </div>
    </div>
  );
};
