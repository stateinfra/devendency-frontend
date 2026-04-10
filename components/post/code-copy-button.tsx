"use client";

import { useState } from "react";
import { Button } from "@/components/ds";

export function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="ghost"
      iconOnly
      size="sm"
      onClick={handleCopy}
      aria-label="코드 복사"
      className="absolute top-3 right-3 bg-black/[0.06] dark:bg-white/[0.06] hover:bg-black/[0.1] dark:hover:bg-white/[0.12] border border-black/[0.08] dark:border-white/[0.08] text-slate-400 hover:text-gray-900 dark:hover:text-white opacity-0 group-hover:opacity-100"
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 14, width: 14, height: 14, fontVariationSettings: "'opsz' 14, 'wght' 300" }}
      >
        {copied ? "check" : "content_copy"}
      </span>
    </Button>
  );
}
