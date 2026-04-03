'use client';

import { useState } from 'react';

export default function CopyButton({
  text,
  label = 'コピー',
  copiedLabel = 'コピーしました!',
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1 rounded text-sm font-medium transition-all whitespace-nowrap ${
        copied
          ? 'bg-green-600 text-white'
          : label === '聞く'
            ? 'bg-purple-600 hover:bg-purple-500 text-white'
            : 'bg-blue-600 hover:bg-blue-500 text-white'
      }`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
