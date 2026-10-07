import React from 'react';
import { ArrowUpCircle } from 'lucide-react';

export default function Recommendations({ headerResults, currentScore }) {
  const missingHeaders = headerResults.filter(h => h.status === 'MISSING');
  const warnHeaders = headerResults.filter(h => h.status === 'WARN');
  
  if (missingHeaders.length === 0 && warnHeaders.length === 0) return null;

  // Calculate potential score
  const potentialScore = Math.min(100, currentScore + missingHeaders.reduce((sum, h) => sum + Math.abs(h.scoreImpact), 0) + warnHeaders.reduce((sum, h) => sum + Math.abs(h.scoreImpact), 0));

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
      <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
        Priority Recommendations
      </h3>
      <div className="space-y-3">
        {[...missingHeaders, ...warnHeaders]
          .sort((a, b) => {
            const levels = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
            return (levels[b.severity] || 0) - (levels[a.severity] || 0);
          })
          .map(h => {
            const badgeColor = 
              h.severity === 'CRITICAL' || h.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 
              h.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' : 
              'bg-blue-500/20 text-blue-400 border-blue-500/20';

            return (
              <div key={h.key} className={`flex items-start gap-3 bg-slate-800/50 p-3 rounded-lg border ${h.severity === 'CRITICAL' || h.severity === 'HIGH' ? 'border-rose-500/20' : 'border-amber-500/20'}`}>
                <span className={`mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${badgeColor}`}>
                  {h.severity}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {h.status === 'MISSING' ? 'Configure ' : 'Strengthen '} 
                    <span className="font-mono text-emerald-300">{h.name}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{h.recommendation}</p>
                </div>
              </div>
            );
          })}
      </div>
      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
        <span className="text-sm text-slate-400">Potential score after fixes</span>
        <span className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-lg">
          {potentialScore} / 100 <ArrowUpCircle className="w-5 h-5" />
        </span>
      </div>
    </div>
  );
}
