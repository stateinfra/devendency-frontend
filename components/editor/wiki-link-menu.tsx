"use client";

import { useEffect, useRef, useState } from "react";
import { searchPostsForAutocomplete } from "@/actions/post-search";

export type WikiSuggestion = { slug: string; title: string };

type Props = {
  position: { x: number; y: number };
  query: string;
  onSelect: (item: WikiSuggestion) => void;
  onClose: () => void;
};

export function WikiLinkMenu({ position, query, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [items, setItems] = useState<WikiSuggestion[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    searchPostsForAutocomplete(query).then((rows) => {
      if (!cancelled) {
        setItems(rows);
        setActive(0);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    itemRefs.current[active]?.scrollIntoView({ block: "nearest" });
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
        className="slash-menu fixed z-[100] bg-white dark:bg-[#2a2a2a] border border-black/[0.1] dark:border-white/[0.1] rounded-xl shadow-2xl px-3 py-2 text-xs text-slate-500"
        style={{ left: position.x, top: position.y }}
      >
        {query ? "일치하는 글 없음" : "글 불러오는 중..."}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="slash-menu fixed z-[100] bg-white dark:bg-[#2a2a2a] border border-black/[0.1] dark:border-white/[0.1] rounded-xl shadow-2xl min-w-[300px] max-h-[320px] overflow-y-auto"
      style={{
        left: position.x,
        top: position.y,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {items.map((it, i) => (
        <button
          key={it.slug}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          type="button"
          onMouseEnter={() => setActive(i)}
          onClick={() => onSelect(it)}
          className={`w-full flex flex-col gap-0.5 px-3 py-2 text-left transition-colors ${
            i === active
              ? "bg-black/[0.06] dark:bg-white/[0.06]"
              : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          }`}
        >
          <span className="text-sm text-gray-700 dark:text-slate-200 truncate">
            {it.title}
          </span>
          <span className="text-[11px] text-slate-500 truncate">
            {it.slug}
          </span>
        </button>
      ))}
    </div>
  );
}
