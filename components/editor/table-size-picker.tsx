"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  position: { x: number; y: number };
  onSelect: (rows: number, cols: number) => void;
  onClose: () => void;
};

const MAX_ROWS = 8;
const MAX_COLS = 10;

export function TableSizePicker({ position, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState({ r: 1, c: 2 });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSelect(hover.r, hover.c);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setHover((h) => ({ ...h, c: Math.min(h.c + 1, MAX_COLS) }));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setHover((h) => ({ ...h, c: Math.max(h.c - 1, 1) }));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHover((h) => ({ ...h, r: Math.min(h.r + 1, MAX_ROWS) }));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHover((h) => ({ ...h, r: Math.max(h.r - 1, 1) }));
      }
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onClick);
    };
  }, [hover, onSelect, onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-[100] bg-white dark:bg-[#2a2a2a] border border-black/[0.1] dark:border-white/[0.1] rounded-xl shadow-2xl p-3"
      style={{ left: position.x, top: position.y }}
    >
      <div className="text-[11px] text-slate-500 mb-2 text-center">
        {hover.r} × {hover.c}
      </div>
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${MAX_COLS}, 18px)`,
          gridTemplateRows: `repeat(${MAX_ROWS}, 18px)`,
        }}
      >
        {Array.from({ length: MAX_ROWS }).map((_, r) =>
          Array.from({ length: MAX_COLS }).map((_, c) => {
            const active = r < hover.r && c < hover.c;
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                aria-label={`${r + 1} × ${c + 1}`}
                onMouseEnter={() => setHover({ r: r + 1, c: c + 1 })}
                onClick={() => onSelect(r + 1, c + 1)}
                className={`size-[18px] rounded-[3px] border transition-colors ${
                  active
                    ? "bg-primary border-primary"
                    : "bg-black/[0.04] dark:bg-white/[0.04] border-black/[0.08] dark:border-white/[0.08]"
                }`}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}

export function buildTableMarkdown(rows: number, cols: number): string {
  const emptyRow = `| ${Array.from({ length: cols }, () => " ").join(" | ")} |`;
  const sep = `| ${Array.from({ length: cols }, () => "---").join(" | ")} |`;
  const body = Array.from({ length: rows }, () => emptyRow).join("\n");
  return `${emptyRow}\n${sep}\n${body}`;
}
