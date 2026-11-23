import React from 'react';

export const StatCard = ({ title, value, subtext, icon: Icon, color = 'cyan' }) => {
  const colorStyles = {
    cyan: {
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/40',
      valColor: 'text-cyan-300'
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
      valColor: 'text-emerald-300'
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-950/60 text-amber-400 border-amber-800/40',
      valColor: 'text-amber-300'
    },
    purple: {
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-purple-950/60 text-purple-400 border-purple-800/40',
      valColor: 'text-purple-300'
    }
  };

  const style = colorStyles[color] || colorStyles.cyan;

  return (
    <div className={`p-5 rounded-2xl bg-slate-900/60 border border-slate-800 ${style.border} transition-all duration-200 shadow-lg backdrop-blur-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-xl border ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className={`text-2xl font-bold font-mono text-white`}>{value}</div>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};
