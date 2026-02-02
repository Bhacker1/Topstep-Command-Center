import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, subValue, trend, highlight }) => {
  return (
    <div className={`p-5 rounded-xl border backdrop-blur-sm transition-all duration-200 hover:border-zinc-700 ${
      highlight 
        ? 'bg-zinc-900/80 border-emerald-500/20 shadow-[0_0_30px_-10px_rgba(16,185,129,0.1)]' 
        : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-900/80'
    }`}>
      <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${highlight ? 'text-emerald-400/80' : 'text-zinc-500'}`}>
        {label}
      </div>
      <div className={`text-2xl md:text-3xl font-bold tracking-tight font-mono ${highlight ? 'text-white' : 'text-zinc-100'}`}>
        {value}
      </div>
      {subValue && (
        <div className={`text-xs font-mono mt-2 flex items-center gap-1 ${
          trend === 'up' ? 'text-emerald-400' : 
          trend === 'down' ? 'text-rose-400' : 
          'text-zinc-500'
        }`}>
          {subValue}
        </div>
      )}
    </div>
  );
};