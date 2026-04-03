'use client';

import { useState } from 'react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1 rounded text-sm font-medium transition-all ${
        copied
          ? 'bg-green-600 text-white'
          : 'bg-blue-600 hover:bg-blue-500 text-white'
      }`}
    >
      {copied ? 'コピーしました!' : 'コピー'}
    </button>
  );
}
