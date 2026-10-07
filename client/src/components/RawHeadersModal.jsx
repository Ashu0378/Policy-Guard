import React, { useState } from 'react';
import { X, Copy, Check, Terminal } from 'lucide-react';

export default function RawHeadersModal({ isOpen, onClose, rawHeaders = {}, headerResults = [] }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const missingKeys = headerResults.filter(h => h.status === 'MISSING').map(h => h.key);
  const presentKeys = Object.keys(rawHeaders);

  const formattedLines = [
    ...presentKeys.map(k => ({ key: k, value: Array.isArray(rawHeaders[k]) ? rawHeaders[k].join(', ') : String(rawHeaders[k]), missing: false })),
    ...missingKeys.map(k => ({ key: k, value: '[missing]', missing: true }))
  ].sort((a, b) => a.key.localeCompare(b.key));

  const textToCopy = formattedLines.map(l => `${l.key}: ${l.value}`).join('\n');

  const handleCopyAll = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white font-mono tracking-tight">Raw HTTP Headers</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-end">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs font-mono border border-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy All'}
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-950 font-mono text-sm space-y-3">
          {formattedLines.map((line, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-start break-all">
              <span className="text-indigo-400 font-bold min-w-[250px]">{line.key}:</span>
              <span className={`${line.missing ? 'text-rose-400 italic' : 'text-emerald-300'}`}>
                {line.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
