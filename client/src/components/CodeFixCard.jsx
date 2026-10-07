import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const CodeFixCard = ({ framework, codeSnippet, header }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden mb-4">
      <div className="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700">
        <span className="text-sm font-medium text-slate-300">
          {header} Fix for {framework}
        </span>
        <button
          onClick={handleCopy}
          className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center space-x-1"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <code className="text-emerald-300 text-sm whitespace-pre">
          {codeSnippet}
        </code>
      </div>
    </div>
  );
};

export default CodeFixCard;
