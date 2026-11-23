import React from 'react';
import { ShieldCheck, Shield, Award } from 'lucide-react';

export const ReputationBadge = ({ score = 75, showScore = true, size = 'md' }) => {
  let tier = {
    label: 'New Escrower',
    color: 'border-amber-500/40 bg-amber-950/50 text-amber-300',
    icon: Shield,
    glow: ''
  };

  if (score >= 85) {
    tier = {
      label: 'Highly Trusted',
      color: 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300',
      icon: Award,
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]'
    };
  } else if (score >= 65) {
    tier = {
      label: 'Trusted Member',
      color: 'border-cyan-500/40 bg-cyan-950/50 text-cyan-300',
      icon: ShieldCheck,
      glow: 'shadow-[0_0_10px_rgba(6,182,212,0.15)]'
    };
  }

  const Icon = tier.icon;
  const sizeClass = size === 'sm' ? 'text-xs py-0.5 px-2 gap-1' : size === 'lg' ? 'text-sm py-1.5 px-3.5 gap-2' : 'text-xs py-1 px-2.5 gap-1.5';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${tier.color} ${tier.glow} ${sizeClass}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{tier.label}</span>
      {showScore && (
        <span className="ml-1 px-1.5 py-0.2 bg-black/40 rounded-full font-mono text-[11px] font-bold">
          {score}/100
        </span>
      )}
    </span>
  );
};
