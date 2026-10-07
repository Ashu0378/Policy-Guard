import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import CodeFixCard from './CodeFixCard';

export default function HeaderAccordion({ headers }) {
  if (!headers || headers.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">Header Evaluation</h3>
      {headers.map(header => (
        <HeaderCard key={header.key} header={header} />
      ))}
    </div>
  );
}

function HeaderCard({ header }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState('express'); // 'express' | 'nginx'

  const statusIcon = 
    header.status === 'PASS' ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> :
    header.status === 'WARN' ? <AlertTriangle className="w-5 h-5 text-amber-400" /> :
    <ShieldAlert className="w-5 h-5 text-rose-400" />;

  const statusLabel = 
    header.status === 'PASS' ? 'PASSED' :
    header.status === 'WARN' ? 'WARNING' : 'MISSING';

  const statusClass =
    header.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
    header.status === 'WARN' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
    'bg-rose-500/20 text-rose-400 border-rose-500/30';

  const severityColor = 
    header.severity === 'CRITICAL' || header.severity === 'HIGH' ? 'text-rose-400' : 
    header.severity === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400';

  const handleCopyHeader = () => {
    const textToCopy = `${header.name}: ${activePlatform === 'express' ? header.expressFix : header.nginxFix}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-lg hover:border-slate-700">
      <div 
        className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {statusIcon}
            <h4 className="font-bold text-slate-200 text-lg font-mono tracking-tight">{header.name}</h4>
            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-slate-400">{header.description}</p>
        </div>

        <div className="flex items-center gap-6 md:border-l md:border-slate-800 md:pl-6">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Severity</p>
            <p className={`text-sm font-bold ${severityColor}`}>
              {header.severity}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Score</p>
            <p className="text-sm font-mono font-bold text-slate-300">
              {header.points} <span className="text-slate-600">/</span> {header.maxPoints}
            </p>
          </div>
          <button className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-5 border-t border-slate-800 bg-slate-900/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Current Value</h5>
              <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-slate-300 break-all">
                {header.value || <span className="text-slate-600 italic">None detected</span>}
              </div>
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Security Impact</h5>
              <p className="text-sm text-slate-400 p-3 bg-slate-800/30 rounded border border-slate-800/50">
                {header.risk}
              </p>
            </div>
          </div>

          {(header.status === 'MISSING' || header.status === 'WARN') && (
            <div className="mt-4 border border-slate-700/50 rounded-lg p-4 bg-slate-800/20">
              <h5 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                How to Fix
              </h5>
              
              <div className="flex gap-2 mb-3 border-b border-slate-700/50 pb-2">
                <button 
                  onClick={() => setActivePlatform('express')}
                  className={`text-xs px-3 py-1.5 rounded-t-lg transition-colors ${activePlatform === 'express' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                >
                  Node.js / Express
                </button>
                <button 
                  onClick={() => setActivePlatform('nginx')}
                  className={`text-xs px-3 py-1.5 rounded-t-lg transition-colors ${activePlatform === 'nginx' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                >
                  Nginx
                </button>
              </div>

              <CodeFixCard 
                framework={activePlatform === 'express' ? 'Express' : 'Nginx'}
                codeSnippet={activePlatform === 'express' ? header.expressFix : header.nginxFix}
                header={header.name}
              />
              
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleCopyHeader}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Snippet'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
