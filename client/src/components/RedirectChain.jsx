import React from 'react';
import { ArrowDown } from 'lucide-react';

export default function RedirectChain({ redirects }) {
  if (!redirects || redirects.length <= 1) return null;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl mb-8">
      <h3 className="text-lg font-bold text-slate-100 mb-6 uppercase tracking-wider text-sm">Redirect Timeline</h3>
      <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-800">
        {redirects.map((hop, idx) => {
          const isFinal = idx === redirects.length - 1;
          const statusColor = 
            isFinal ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' : 
            'text-amber-400 bg-amber-500/20 border-amber-500/30';
          const iconColor = isFinal ? 'bg-emerald-500' : 'bg-amber-500';

          return (
            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 ${iconColor} text-slate-900 font-bold text-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xl z-10`}>
                {String(idx + 1).padStart(2, '0')}
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-sm mb-4">
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-mono text-slate-300 break-all">{hop.url}</div>
                  <div className={`self-start px-2 py-0.5 rounded text-xs font-bold border ${statusColor}`}>
                    {hop.status} {isFinal ? 'OK (Final Response)' : 'Redirect'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
