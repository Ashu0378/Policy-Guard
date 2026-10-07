import React, { useState } from 'react';
import { BookOpen, ShieldCheck, Terminal, Copy, Check, ExternalLink, Code2, Server } from 'lucide-react';

const SECURITY_HEADERS_GUIDE = [
  {
    key: 'content-security-policy',
    name: 'Content-Security-Policy (CSP)',
    level: 'Critical',
    summary: 'Mitigates Cross-Site Scripting (XSS) and data injection by specifying trusted dynamic resources.',
    nginx: `add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'nonce-rAnd0m'; object-src 'none';" always;`,
    express: `app.use(helmet.contentSecurityPolicy({\n  directives: {\n    defaultSrc: ["'self'"],\n    scriptSrc: ["'self'"],\n    objectSrc: ["'none'"]\n  }\n}));`,
    apache: `Header always set Content-Security-Policy "default-src 'self'; script-src 'self';"`,
    refUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'
  },
  {
    key: 'strict-transport-security',
    name: 'Strict-Transport-Security (HSTS)',
    level: 'Critical',
    summary: 'Forces browsers to connect strictly over HTTPS, defending against SSL stripping & MITM attacks.',
    nginx: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`,
    express: `app.use(helmet.hsts({\n  maxAge: 31536000,\n  includeSubDomains: true,\n  preload: true\n}));`,
    apache: `Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"`,
    refUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security'
  },
  {
    key: 'x-content-type-options',
    name: 'X-Content-Type-Options',
    level: 'High',
    summary: 'Prevents browsers from MIME-sniffing responses away from the declared content-type.',
    nginx: `add_header X-Content-Type-Options "nosniff" always;`,
    express: `app.use(helmet.noSniff());`,
    apache: `Header always set X-Content-Type-Options "nosniff"`,
    refUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options'
  },
  {
    key: 'x-frame-options',
    name: 'X-Frame-Options',
    level: 'High',
    summary: 'Protects visitors from Clickjacking by controlling iframe framing permissions.',
    nginx: `add_header X-Frame-Options "DENY" always;`,
    express: `app.use(helmet.frameguard({ action: "deny" }));`,
    apache: `Header always set X-Frame-Options "DENY"`,
    refUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options'
  },
  {
    key: 'referrer-policy',
    name: 'Referrer-Policy',
    level: 'Medium',
    summary: 'Controls origin information transmitted in the Referer header on outgoing requests.',
    nginx: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
    express: `app.use(helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" }));`,
    apache: `Header always set Referrer-Policy "strict-origin-when-cross-origin"`,
    refUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy'
  },
  {
    key: 'permissions-policy',
    name: 'Permissions-Policy',
    level: 'Medium',
    summary: 'Restricts access to browser hardware and privacy APIs (Camera, Microphone, Geolocation).',
    nginx: `add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;`,
    express: `res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");`,
    apache: `Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"`,
    refUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy'
  }
];

export default function KnowledgeBase() {
  const [copiedKey, setCopiedKey] = useState(null);
  const [serverType, setServerType] = useState('express'); // 'express' | 'nginx' | 'apache'

  const handleCopy = (code, key) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="w-full glass-panel rounded-3xl p-6 md:p-8 mb-8 shadow-2xl animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">HTTP Security Headers Reference Guide</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Production hardening standards, threat mitigations, and server configuration cheat sheets.
          </p>
        </div>

        {/* Server Config Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setServerType('express')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              serverType === 'express' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Node / Express
          </button>
          <button
            type="button"
            onClick={() => setServerType('nginx')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              serverType === 'nginx' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Nginx
          </button>
          <button
            type="button"
            onClick={() => setServerType('apache')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              serverType === 'apache' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Apache
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECURITY_HEADERS_GUIDE.map((item) => {
          const currentCode = item[serverType];

          return (
            <div
              key={item.key}
              className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-slate-200">{item.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    item.level === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    item.level === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {item.level} Severity
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    {serverType.toUpperCase()} Configuration
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentCode, item.key)}
                    className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    {copiedKey === item.key ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copy
                      </span>
                    )}
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs font-mono text-indigo-300 overflow-x-auto whitespace-pre">
                  <code>{currentCode}</code>
                </div>

                <div className="mt-3 text-right">
                  <a
                    href={item.refUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-slate-500 hover:text-slate-300 inline-flex items-center gap-1 transition-colors"
                  >
                    MDN Documentation <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
