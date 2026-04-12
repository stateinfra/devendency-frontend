"use client";

import { useEffect, useRef, useState, useMemo } from "react";

export type SlashItem = {
  key: string;
  label: string;
  desc: string;
  icon: string;
  /** 새 줄 단위 스니펫. ${C}로 커서 위치 표시. */
  snippet: string;
  keywords?: string[];
};

export const SLASH_ITEMS: SlashItem[] = [
  { key: "h1", label: "제목 1", desc: "큰 제목", icon: "format_h1", snippet: "# ${C}", keywords: ["heading", "title"] },
  { key: "h2", label: "제목 2", desc: "중간 제목", icon: "format_h2", snippet: "## ${C}", keywords: ["heading"] },
  { key: "h3", label: "제목 3", desc: "작은 제목", icon: "format_h3", snippet: "### ${C}", keywords: ["heading"] },
  { key: "ul", label: "목록", desc: "순서 없는 목록", icon: "format_list_bulleted", snippet: "- ${C}", keywords: ["list", "bullet"] },
  { key: "ol", label: "번호 목록", desc: "순서 있는 목록", icon: "format_list_numbered", snippet: "1. ${C}", keywords: ["list", "numbered"] },
  { key: "todo", label: "할 일", desc: "체크리스트", icon: "check_box", snippet: "- [ ] ${C}", keywords: ["todo", "task", "checkbox"] },
  { key: "quote", label: "인용", desc: "인용문", icon: "format_quote", snippet: "> ${C}", keywords: ["quote", "blockquote"] },
  { key: "code", label: "코드 블록", desc: "코드 (언어 지정)", icon: "code", snippet: "```ts\n${C}\n```", keywords: ["code", "block"] },
  { key: "mermaid", label: "다이어그램", desc: "Mermaid 다이어그램", icon: "schema", snippet: "```mermaid\nflowchart LR\n  A --> B\n${C}\n```", keywords: ["mermaid", "diagram"] },
  { key: "table", label: "표", desc: "마크다운 표", icon: "table_chart", snippet: "| 헤더 | 헤더 |\n| --- | --- |\n| ${C} |  |", keywords: ["table"] },
  { key: "hr", label: "구분선", desc: "수평선", icon: "horizontal_rule", snippet: "---\n${C}", keywords: ["divider", "hr"] },
  { key: "link", label: "링크", desc: "[텍스트](URL)", icon: "link", snippet: "[${C}](https://)", keywords: ["link", "url"] },
  { key: "math", label: "수식", desc: "KaTeX 수식 블록", icon: "function", snippet: "$$\n${C}\n$$", keywords: ["math", "katex", "latex"] },
];

type Props = {
  position: { x: number; y: number };
  query: string;
  onSelect: (item: SlashItem) => void;
  onClose: () => void;
};

export function SlashMenu({ position, query, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SLASH_ITEMS;
    return SLASH_ITEMS.filter((it) =>
      it.label.toLowerCase().includes(q) ||
      it.key.includes(q) ||
      it.keywords?.some((k) => k.includes(q)),
    );
  }, [query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  // Scroll active item into view (only within menu container, not page)
  useEffect(() => {
    const container = ref.current;
    const item = itemRefs.current[active];
    if (!container || !item) return;
    const cTop = container.scrollTop;
    const cBottom = cTop + container.clientHeight;
    const iTop = item.offsetTop;
    const iBottom = iTop + item.offsetHeight;
    if (iTop < cTop) {
      container.scrollTop = iTop;
    } else if (iBottom > cBottom) {
      container.scrollTop = iBottom - container.clientHeight;
    }
  }, [active]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (items.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        onSelect(items[active]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
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
  }, [items, active, onSelect, onClose]);

  if (items.length === 0) {
    return (
      <div
        ref={ref}
        className="fixed z-[100] bg-white dark:bg-[#2a2a2a] border border-black/[0.1] dark:border-white/[0.1] rounded-xl shadow-2xl px-3 py-2 text-xs text-slate-500"
        style={{ left: position.x, top: position.y }}
      >
        결과 없음
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="slash-menu fixed z-[100] bg-white dark:bg-[#2a2a2a] border border-black/[0.1] dark:border-white/[0.1] rounded-xl shadow-2xl min-w-[260px] max-h-[320px] overflow-y-auto"
      style={{
        left: position.x,
        top: position.y,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {items.map((it, i) => (
        <button
          key={it.key}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          type="button"
          onMouseEnter={() => setActive(i)}
          onClick={() => onSelect(it)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
            i === active
              ? "bg-black/[0.06] dark:bg-white/[0.06]"
              : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          }`}
        >
          <span className="material-symbols-outlined text-[18px] text-slate-500 shrink-0">
            {it.icon}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm text-gray-700 dark:text-slate-200 truncate">
              {it.label}
            </span>
            <span className="block text-[11px] text-slate-500 truncate">
              {it.desc}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
