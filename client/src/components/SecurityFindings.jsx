import React from 'react';
import { AlertCircle, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

export default function SecurityFindings({ headerResults = [] }) {
  const critical = headerResults.filter(h => h.severity === 'CRITICAL');
  const high = headerResults.filter(h => h.severity === 'HIGH');
  const medium = headerResults.filter(h => h.severity === 'MEDIUM');
  const low = headerResults.filter(h => h.severity === 'LOW');

  const findings = [
    { label: 'CRITICAL', count: critical.length, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: AlertOctagon },
    { label: 'HIGH', count: high.length, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle },
    { label: 'MEDIUM', count: medium.length, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: AlertCircle },
    { label: 'LOW', count: low.length, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: Info },
  ];

  return (
    <div className="w-full glass-panel rounded-3xl p-6 md:p-8 mb-8 border border-slate-800 shadow-xl overflow-hidden">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-slate-400" />
        Security Findings
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {findings.map((f) => (
          <div key={f.label} className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${f.border} ${f.bg}`}>
            <f.icon className={`w-6 h-6 mb-2 ${f.color}`} />
            <span className="text-3xl font-bold text-white mb-1">{f.count}</span>
            <span className={`text-xs font-bold tracking-wider ${f.color}`}>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
