"use client";

import { useState } from "react";

export function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="코드 복사"
      className="absolute top-3 right-3 p-1.5 flex items-center justify-center rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 14, width: 14, height: 14, fontVariationSettings: "'opsz' 14, 'wght' 300" }}
      >
        {copied ? "check" : "content_copy"}
      </span>
    </button>
  );
}
