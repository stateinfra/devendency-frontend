"use client";

import { useState } from "react";

interface CodeBlockProps {
  filename: string;
  children: React.ReactNode;
  code: string;
}

export default function CodeBlock({ filename, children, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-8 rounded-xl overflow-hidden border border-white/[0.08] bg-[#1a1a1a] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-[#BF616A]" />
            <div className="size-3 rounded-full bg-[#EBCB8B]" />
            <div className="size-3 rounded-full bg-[#A3BE8C]" />
          </div>
          <span className="text-xs text-[#dcddde]/40 font-mono ml-2">
            {filename}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/[0.06] text-[#dcddde]/40 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">
            {copied ? "check" : "content_copy"}
          </span>
          <span className="text-xs font-medium">{copied ? "복사됨" : "코드 복사"}</span>
        </button>
      </div>
      <div className="relative overflow-x-auto custom-scrollbar p-6">
        <pre
          className="font-mono text-sm leading-relaxed text-[#ECEFF4]"
          style={{ tabSize: 2 }}
        >
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
}
