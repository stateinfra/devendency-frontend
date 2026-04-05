"use client";

import { useEffect, useRef } from "react";

type YouTubePasteMenuProps = {
  url: string;
  videoId: string;
  position: { x: number; y: number };
  onSelect: (type: "text" | "link" | "video") => void;
  onClose: () => void;
};

export function YouTubePasteMenu({
  url,
  videoId,
  position,
  onSelect,
  onClose,
}: YouTubePasteMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-[100] bg-[#2a2a2a] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden min-w-[200px]"
      style={{ left: position.x, top: position.y }}
    >
      <div className="px-3 py-2 border-b border-white/[0.06] text-[11px] text-slate-500 truncate max-w-[280px]">
        {url}
      </div>
      <button
        type="button"
        onClick={() => onSelect("text")}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06] transition-colors"
      >
        <span className="material-symbols-outlined text-[16px] text-slate-500">text_fields</span>
        텍스트로 붙여넣기
      </button>
      <button
        type="button"
        onClick={() => onSelect("link")}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06] transition-colors"
      >
        <span className="material-symbols-outlined text-[16px] text-slate-500">link</span>
        링크로 붙여넣기
      </button>
      <button
        type="button"
        onClick={() => onSelect("video")}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06] transition-colors"
      >
        <span className="material-symbols-outlined text-[16px] text-slate-500">play_circle</span>
        동영상으로 붙여넣기
      </button>
    </div>
  );
}
