import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, ArrowRightLeft, ShieldAlert, FilePlus } from 'lucide-react';

export const StatusBadge = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold'
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'Created':
        return {
          bg: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300',
          dot: 'bg-indigo-400',
          icon: FilePlus,
          label: 'Created'
        };
      case 'In Progress':
        return {
          bg: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400 animate-pulse',
          icon: Clock,
          label: 'In Progress'
        };
      case 'Delivered':
        return {
          bg: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300',
          dot: 'bg-cyan-400',
          icon: ArrowRightLeft,
          label: 'Delivered'
        };
      case 'Completed':
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400',
          icon: CheckCircle2,
          label: 'Completed'
        };
      case 'Disputed':
        return {
          bg: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
          dot: 'bg-rose-400 animate-ping',
          icon: ShieldAlert,
          label: 'Disputed'
        };
      case 'Refunded':
        return {
          bg: 'bg-slate-800/80 border-slate-600 text-slate-300',
          dot: 'bg-slate-400',
          icon: AlertTriangle,
          label: 'Refunded'
        };
      default:
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
          icon: Clock,
          label: status || 'Unknown'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center rounded-full border shadow-sm ${config.bg} ${sizeClasses[size] || sizeClasses.md}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};
