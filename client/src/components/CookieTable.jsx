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
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-800 border-b border-slate-700">
            <th className="p-3 text-slate-300 font-medium rounded-tl-lg">Cookie Name</th>
            <th className="p-3 text-slate-300 font-medium">Secure</th>
            <th className="p-3 text-slate-300 font-medium">HttpOnly</th>
            <th className="p-3 text-slate-300 font-medium">SameSite</th>
            <th className="p-3 text-slate-300 font-medium rounded-tr-lg">Risk Level</th>
          </tr>
        </thead>
        <tbody className="bg-slate-900/50 divide-y divide-slate-800">
          {cookies.map((cookie, idx) => (
            <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
              <td className="p-3 font-mono text-emerald-300 truncate max-w-[200px]" title={cookie.name}>
                {cookie.name}
              </td>
              <td className="p-3">
                {cookie.secure ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-rose-400 font-bold">✕</span>
                )}
              </td>
              <td className="p-3">
                {cookie.httpOnly ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-rose-400 font-bold">✕</span>
                )}
              </td>
              <td className="p-3 text-slate-400">
                {cookie.sameSite || 'None'}
              </td>
              <td className="p-3">
                {cookie.riskLevel === 'HIGH' ? (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-xs font-bold">
                    <ShieldAlert className="w-3 h-3 mr-1" /> High Risk
                  </span>
                ) : cookie.riskLevel === 'MEDIUM' ? (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-bold">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Sensitive Flag Missing
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Low Risk
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CookieTable;
