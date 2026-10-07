import React, { useState } from 'react';
import { ShieldCheck, ArrowUpRight, Clock, Info, ChevronDown, ChevronUp } from 'lucide-react';
import ScoreBreakdown from './ScoreBreakdown';
import Recommendations from './Recommendations';

export default function ScoreGauge({ scanData, onOpenRawHeaders }) {
  const [showCalculation, setShowCalculation] = useState(false);
  if (!scanData) return null;

  const { targetUrl, domain, score, grade, headerResults = [], scanDurationMs } = scanData;

  const passedCount = headerResults.filter(h => h.status === 'PASS').length;
  const warnCount = headerResults.filter(h => h.status === 'WARN').length;
  const missingCount = headerResults.filter(h => h.status === 'MISSING').length;

  const getTheme = (s) => {
    if (s >= 85) return {
      color: '#10b981', stroke: 'stroke-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10',
      message: 'Excellent security posture. Keep it up.'
    };
    if (s >= 75) return {
      color: '#eab308', stroke: 'stroke-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10',
      message: 'Good posture, but some headers can be hardened.'
    };
    if (s >= 60) return {
      color: '#f59e0b', stroke: 'stroke-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10',
      message: 'Moderate posture. Immediate header hardening recommended.'
    };
    return {
      color: '#ef4444', stroke: 'stroke-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10',
      message: 'Header hardening is strongly recommended.'
    };
  };

  const theme = getTheme(score);
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="w-full mb-8 space-y-6">
      {/* Top Banner & Raw Headers Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">SECURITY ASSESSMENT REPORT</span>
            <span className="text-[10px] px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/30 font-mono bg-emerald-500/10 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> HTTPS Verified
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            {domain}
            <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-400 transition-colors">
              <ArrowUpRight className="w-5 h-5" />
            </a>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 font-mono">
            <Clock className="w-3.5 h-3.5" />
            {scanDurationMs}ms
          </div>
          <button
            onClick={onOpenRawHeaders}
            className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 transition-all hover:border-slate-500 shadow-sm"
          >
            Raw Headers
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Hero Score */}
        <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-xl border border-slate-800 relative">
          <span className="text-xs font-bold text-slate-400 tracking-widest mb-4">SECURITY SCORE</span>
          
          <div className="relative flex items-center justify-center mb-6 group">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r={radius} className="stroke-slate-800" strokeWidth="8" fill="transparent" />
              <circle
                cx="96" cy="96" r={radius}
                className={`${theme.stroke} transition-all duration-1500 ease-out`}
                strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-5xl font-black ${theme.text}`}>{grade}</span>
              <span className="text-lg font-bold text-slate-200 font-mono mt-1">
                {score}<span className="text-sm text-slate-500"> / 100</span>
              </span>
            </div>
          </div>

          <div className="text-sm font-medium text-slate-300 flex gap-2 items-center mb-3">
            <span className="text-rose-400">{missingCount} Missing</span> <span className="text-slate-600">·</span>
            <span className="text-amber-400">{warnCount} Warnings</span> <span className="text-slate-600">·</span>
            <span className="text-emerald-400">{passedCount} Passed</span>
          </div>

          <p className="text-sm text-slate-400 text-center max-w-sm">
            {theme.message}
          </p>
        </div>

        {/* Right Column: Breakdown */}
        <ScoreBreakdown headerResults={headerResults} />
      </div>

      {/* Priority Recommendations */}
      <Recommendations headerResults={headerResults} currentScore={score} />

      {/* Security Context & Calculation Explanation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowCalculation(!showCalculation)}
          className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 text-sm font-semibold text-slate-300 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            How is this score calculated?
          </span>
          {showCalculation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showCalculation && (
          <div className="p-4 border-t border-slate-800 text-sm text-slate-400 space-y-4">
            <p>
              The security score is calculated out of 100 points based on the presence and configuration of modern HTTP security headers.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Content-Security-Policy</strong>: up to 20 points</li>
              <li><strong>Strict-Transport-Security (HSTS)</strong>: up to 15 points</li>
              <li><strong>Cross-Origin-Opener-Policy</strong>: up to 15 points</li>
              <li><strong>X-Content-Type-Options</strong>: up to 10 points</li>
              <li><strong>X-Frame-Options</strong>: up to 10 points</li>
              <li><strong>Referrer-Policy</strong>: up to 10 points</li>
              <li><strong>Permissions-Policy</strong>: up to 10 points</li>
            </ul>
            <p className="text-xs">
              <strong className="text-rose-400">Important:</strong> Security headers are evaluated directly from the HTTP response received by the scanner. Missing or weak headers reduce the security score regardless of domain reputation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
