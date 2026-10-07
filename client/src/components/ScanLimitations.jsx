import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

export default function ScanLimitations() {
  return (
    <div className="w-full bg-slate-900/50 rounded-2xl p-6 border border-slate-800/80 mb-8 mt-12">
      <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-slate-500" />
        Scan Limitations & Confidence
      </h3>
      
      <div className="space-y-3 text-sm text-slate-400">
        <p className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <span><strong>Geographic Variability:</strong> CDN behavior and load balancers may serve different security headers based on the scanner's geographic origin.</span>
        </p>
        <p className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <span><strong>Authentication States:</strong> Only the publicly accessible, unauthenticated response was evaluated. Authenticated routes may have different policies.</span>
        </p>
        <p className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <span><strong>Point-in-Time:</strong> This assessment represents a snapshot of the HTTP response at the exact moment of the scan.</span>
        </p>
      </div>
    </div>
  );
}
