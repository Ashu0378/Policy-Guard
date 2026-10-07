import React, { useState } from 'react';
import { Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export default function RedirectChain({ redirects }) {
  if (!redirects || redirects.length <= 1) return null;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl mb-8">
      <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
        Redirect Chain Analysis
      </h3>
      <div className="space-y-4">
        {redirects.map((hop, idx) => (
          <RedirectHop key={idx} hop={hop} idx={idx} total={redirects.length} />
        ))}
      </div>
    </div>
  );
}

function RedirectHop({ hop, idx, total }) {
  const [expanded, setExpanded] = useState(false);
  const isFinal = hop.isFinal || idx === total - 1;
  const isInitial = idx === 0;
  
  const statusColor = 
    isFinal ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 
    hop.status >= 400 ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
    'text-amber-400 bg-amber-500/10 border-amber-500/30';

  const label = isFinal ? 'Final Response' : isInitial ? 'Initial Request' : 'Redirect';

  return (
    <div className={`p-4 rounded-xl border transition-all ${isFinal ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
              {hop.status} {label}
            </span>
            {hop.durationMs && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                <Clock className="w-3 h-3" /> {hop.durationMs}ms
              </span>
            )}
          </div>
          <div className="font-mono text-xs text-slate-300 break-all pr-4">
            {hop.url}
          </div>
        </div>
        <div className="flex items-center text-slate-500 shrink-0">
          <button className="text-xs hover:text-slate-300 flex items-center gap-1 transition-colors">
            {expanded ? 'Hide Headers' : 'View Headers'}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {expanded && hop.headers && (
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          {hop.location && (
            <div className="mb-3 flex gap-2 text-xs">
              <span className="text-slate-500 font-bold uppercase">Location:</span>
              <a href={hop.location} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1 break-all">
                {hop.location} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          <div className="bg-slate-950 rounded border border-slate-800 p-3 max-h-60 overflow-y-auto">
            <pre className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap">
              {Object.entries(hop.headers).map(([k, v]) => (
                <div key={k} className="mb-1">
                  <span className="text-indigo-300">{k}:</span> <span className="text-emerald-200/80">{v}</span>
                </div>
              ))}
            </pre>
          </div>
          {isFinal && (
            <div className="mt-3 text-[11px] text-emerald-400/80 bg-emerald-500/10 px-3 py-2 rounded border border-emerald-500/20">
              This response was used to calculate the final security score and header evaluations.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
