import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

const CookieTable = ({ cookies }) => {
  if (!cookies || cookies.length === 0) {
    return (
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-slate-400">
        No cookies were found on the target domain.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl mb-8">
      <h3 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-2">Advanced Checks: Cookie Security</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-700">
              <th className="p-3 text-slate-300 font-medium rounded-tl-lg">Cookie Name</th>
              <th className="p-3 text-slate-300 font-medium">Domain</th>
              <th className="p-3 text-slate-300 font-medium">Path</th>
              <th className="p-3 text-slate-300 font-medium">Expires/Max-Age</th>
              <th className="p-3 text-slate-300 font-medium text-center">Secure</th>
              <th className="p-3 text-slate-300 font-medium text-center">HttpOnly</th>
              <th className="p-3 text-slate-300 font-medium text-center">SameSite</th>
              <th className="p-3 text-slate-300 font-medium rounded-tr-lg">Risk Level</th>
            </tr>
          </thead>
          <tbody className="bg-slate-900/50 divide-y divide-slate-800">
            {cookies.map((cookie, idx) => (
              <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-3 font-mono text-emerald-300 max-w-[150px] truncate" title={cookie.name}>
                  {cookie.name}
                </td>
                <td className="p-3 text-slate-400 font-mono text-xs">{cookie.domain || '-'}</td>
                <td className="p-3 text-slate-400 font-mono text-xs">{cookie.path || '/'}</td>
                <td className="p-3 text-slate-400 text-xs">{cookie.expires || 'Session'}</td>
                <td className="p-3 text-center">
                  {cookie.secure ? <span className="text-emerald-400">✓</span> : <span className="text-rose-400 font-bold">✕</span>}
                </td>
                <td className="p-3 text-center">
                  {cookie.httpOnly ? <span className="text-emerald-400">✓</span> : <span className="text-rose-400 font-bold">✕</span>}
                </td>
                <td className="p-3 text-slate-400 text-center text-xs">
                  {cookie.sameSite || 'None'}
                </td>
                <td className="p-3">
                  {cookie.riskLevel === 'HIGH' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                      <ShieldAlert className="w-3 h-3 mr-1" /> High Risk
                    </span>
                  ) : cookie.riskLevel === 'MEDIUM' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Warning
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Secure
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CookieTable;
