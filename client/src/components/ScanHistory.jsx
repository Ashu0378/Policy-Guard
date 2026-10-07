import React from 'react';
import { History, ExternalLink, Trash2, Clock } from 'lucide-react';

export default function ScanHistory({ history = [], onSelectScan, onClearHistory }) {
  if (!history || history.length === 0) {
    return (
      <div className="w-full glass-panel rounded-3xl p-6 md:p-8 mb-8 text-center text-slate-400">
        <div className="flex items-center justify-center gap-2 text-slate-300 font-bold mb-2">
          <History className="w-5 h-5 text-emerald-400" />
          <span>Recent Scan History</span>
        </div>
        <p className="text-xs text-slate-500">No recent security scan history recorded yet. Enter a domain above to run your first scan!</p>
      </div>
    );
  }

  const getGradeBadgeClass = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'B':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'C':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'D':
      case 'F':
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="w-full glass-panel rounded-3xl p-6 md:p-8 mb-8 shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            Recent Security Scans History
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Top 5 recent scans saved in MongoDB. Click any scan to load full report.
          </p>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-800 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {history.map((item, idx) => {
          const dateStr = item.scannedAt
            ? new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Recent';

          return (
            <button
              key={item._id || idx}
              type="button"
              onClick={() => onSelectScan(item)}
              className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-emerald-500/40 text-left transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${getGradeBadgeClass(item.grade)} font-mono`}>
                    {item.grade} ({item.score})
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {dateStr}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate font-mono">
                  {item.domain}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>{item.headerResults ? `${item.headerResults.filter(h => h.status === 'PASS').length}/${item.headerResults.length} Passed` : 'Report Ready'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
