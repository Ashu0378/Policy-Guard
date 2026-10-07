import React, { useState } from 'react';
import { Search, Loader2, ShieldAlert, Globe, ArrowRight } from 'lucide-react';

const PRESET_DOMAINS = [
  { name: 'github.com', label: 'Developer Platform' },
  { name: 'google.com', label: 'Search Engine' },
  { name: 'cloudflare.com', label: 'CDN / Security' },
  { name: 'stripe.com', label: 'Payment Infrastructure' },
  { name: 'stackoverflow.com', label: 'Community' }
];

export default function ScanForm({ onScan, loading }) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  const validate = (val) => {
    if (!val.trim()) {
      setValidationError('');
      return false;
    }
    const clean = val.trim();
    if (clean.includes('localhost') || clean.includes('127.0.0.1')) {
      setValidationError('SSRF Protection Active: Scanning local loopback addresses is blocked.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    validate(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setValidationError('Please specify a target domain or URL to audit.');
      return;
    }
    if (validate(url)) {
      onScan(url.trim());
    }
  };

  const handleChipClick = (domain) => {
    setUrl(domain);
    setValidationError('');
    onScan(domain);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-10">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-900/90 rounded-2xl p-2 border border-slate-700/80 shadow-2xl transition-all duration-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
          <div className="flex items-center flex-1 px-3 py-2 sm:py-0">
            <Globe className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={url}
              onChange={handleChange}
              placeholder="Enter domain or URL (e.g., github.com or https://example.com)..."
              disabled={loading}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none disabled:opacity-50 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-150 shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Auditing Target...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Run Audit</span>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </>
            )}
          </button>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 text-rose-400 text-xs mt-2 px-3 font-mono">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </form>

      {/* Preset Target Domains */}
      <div className="flex flex-wrap items-center gap-2 mt-4 px-1">
        <span className="text-xs text-slate-400 font-medium mr-1">
          Preset Benchmark Domains:
        </span>
        {PRESET_DOMAINS.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => handleChipClick(item.name)}
            disabled={loading}
            className="px-3 py-1 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>{item.name}</span>
            <span className="text-[10px] text-slate-500 font-sans">({item.label})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
