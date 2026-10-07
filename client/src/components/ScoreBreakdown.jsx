import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function ScoreBreakdown({ headerResults }) {
  if (!headerResults) return null;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <h3 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Score Breakdown</h3>
      <div className="space-y-4">
        {headerResults.map((header) => {
          const pct = Math.round((header.points / header.maxPoints) * 100);
          const statusIcon =
            header.status === 'PASS' ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> :
            header.status === 'WARN' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
            <ShieldAlert className="w-4 h-4 text-rose-400" />;

          const barColor = 
            header.status === 'PASS' ? 'bg-emerald-500' :
            header.status === 'WARN' ? 'bg-amber-500' :
            'bg-rose-500';

          return (
            <div key={header.key} className="space-y-1.5 group">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-slate-300 flex items-center gap-2">
                  {header.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono">
                    {header.points} / {header.maxPoints}
                  </span>
                  {statusIcon}
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${barColor} transition-all duration-1000 ease-out`} 
                  style={{ width: `${pct}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
