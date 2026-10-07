import React, { useState } from 'react';
import { useScan } from './hooks/useScan';
import ScanForm from './components/ScanForm';
import ScoreGauge from './components/ScoreGauge';
import HeaderAccordion from './components/HeaderAccordion';
import CookieTable from './components/CookieTable';
import RawHeadersModal from './components/RawHeadersModal';
import ScanHistory from './components/ScanHistory';
import KnowledgeBase from './components/KnowledgeBase';
import RedirectChain from './components/RedirectChain';
import SecurityFindings from './components/SecurityFindings';
import ScanLimitations from './components/ScanLimitations';
import Recommendations from './components/Recommendations';
import { ShieldCheck, Lock, Download, ShieldAlert, CheckCircle2, BookOpen, Layers } from 'lucide-react';

export default function App() {
  const {
    scanResult,
    history,
    loading,
    error,
    setError,
    executeScan,
    selectScan,
    clearScanHistory
  } = useScan();

  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'knowledge'

  const handleExportJSON = () => {
    if (!scanResult) return;
    const jsonStr = JSON.stringify(scanResult, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PolicyGuard_Audit_${scanResult.domain || 'report'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Real Enterprise Header */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-bold tracking-tight text-white">PolicyGuard</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 rounded-md">
                  Security Auditor
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'scanner' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Live Scanner
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'knowledge' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Headers Guide
            </button>
          </div>

          {/* Export Report Action */}
          <div className="hidden sm:flex items-center gap-3">
            {scanResult && activeTab === 'scanner' && (
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-700/80 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" /> Export JSON Report
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {activeTab === 'scanner' ? (
          <>
            {/* Title / Description */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Web Security Header & Set-Cookie Auditor
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Inspect raw HTTP response headers, evaluate CSP/HSTS compliance, and audit cookie security flags with actionable server remediation configs.
              </p>
            </div>

            {/* Target Input Form */}
            <ScanForm onScan={executeScan} loading={loading} />

            {/* Error Banner */}
            {error && (
              <div className="max-w-4xl mx-auto mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 shadow-xl">
                <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-xs md:text-sm">
                  <span className="font-bold block text-rose-200">Security Inspection Alert</span>
                  <p className="mt-0.5 leading-relaxed font-mono text-xs">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-xs text-rose-400 hover:text-rose-200 font-bold px-2 py-1 rounded bg-rose-500/20"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Scan Dashboard */}
            {scanResult && (
              <div className="animate-fade-in">
                <ScoreGauge
                  scanData={scanResult}
                  onOpenRawHeaders={() => setIsRawModalOpen(true)}
                />

                <SecurityFindings headerResults={scanResult.headerResults} />

                <HeaderAccordion headers={scanResult.headerResults} />

                <RedirectChain redirects={scanResult.redirectHistory} />

                <Recommendations headerResults={scanResult.headerResults} currentScore={scanResult.score} />

                <CookieTable cookies={scanResult.cookieResults} />

                <ScanLimitations />
              </div>
            )}

            {/* History Section */}
            <ScanHistory
              history={history}
              onSelectScan={selectScan}
              onClearHistory={clearScanHistory}
              loading={loading}
            />
          </>
        ) : (
          <KnowledgeBase />
        )}
      </main>

      {/* Raw Headers Drawer Modal */}
      {scanResult && (
        <RawHeadersModal
          isOpen={isRawModalOpen}
          onClose={() => setIsRawModalOpen(false)}
          rawHeaders={scanResult.rawHeaders}
          headerResults={scanResult.headerResults}
        />
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>PolicyGuard Web Security Scanner</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              MERN Architecture
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              SSRF Protection
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
