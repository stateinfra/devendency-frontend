"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLike } from "./like-context";
import { toast } from "sonner";

type PostActionsProps = {
  variant?: "sidebar" | "bottom" | "inline";
  markdownContent?: string;
};

type ShareItem = {
  icon: string | null;
  customIcon?: React.ReactNode;
  label: string;
  action: () => void;
  hoverColor: string;
};

function useShareItems(markdownContent?: string, onDone?: () => void, iconSize: number = 20): ShareItem[] {
  return [
    {
      icon: "link",
      label: "URL 복사",
      hoverColor: "#22c55e",
      action: () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("URL이 복사되었습니다");
        onDone?.();
      },
    },
    {
      icon: "content_copy",
      label: "마크다운 복사",
      hoverColor: "#a78bfa",
      action: () => {
        if (markdownContent) {
          navigator.clipboard.writeText(markdownContent);
          toast.success("마크다운이 복사되었습니다");
        }
        onDone?.();
      },
    },
    {
      icon: null,
      customIcon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="shrink-0" style={{ width: iconSize * 0.75, height: iconSize * 0.75 }}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      label: "X에 공유",
      hoverColor: "#1d9bf0",
      action: () => {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(document.title);
        window.open(`https://x.com/intent/tweet?url=${url}&text=${text}`, "_blank");
        onDone?.();
      },
    },
  ];
}

function ShareInline({
  markdownContent,
  buttonClass,
  buttonSize,
  iconSize,
}: {
  markdownContent?: string;
  buttonClass: string;
  buttonSize: number;
  iconSize: number;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const items = useShareItems(markdownContent, close, iconSize);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="flex items-center">
      {/* Share items */}
      {items.map((item, i) => (
        <button
          key={item.label}
          onClick={item.action}
          className={`flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 bg-card text-gray-400 dark:text-[#dcddde]/40 shadow-sm transition-all duration-200 hover:scale-105 ${
            open
              ? "opacity-100"
              : "opacity-0 scale-75 pointer-events-none"
          }`}
          style={{
            width: open ? buttonSize : 0,
            height: open ? buttonSize : 0,
            marginRight: open ? 2 : 0,
            transitionDelay: open ? `${i * 50}ms` : `${(items.length - i) * 30}ms`,
            ["--hover-color" as string]: item.hoverColor,
          }}
          title={item.label}
        >
          {item.customIcon ?? (
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: iconSize }}>
              {item.icon}
            </span>
          )}
        </button>
      ))}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={`${buttonClass} transition-all duration-200 ${
          open ? "text-gray-500 dark:text-slate-300 bg-black/5 dark:bg-white/10" : ""
        }`}
        style={{ width: buttonSize, height: buttonSize }}
      >
        <span
          className="material-symbols-outlined transition-transform duration-200"
          style={{ fontSize: iconSize }}
        >
          {open ? "close" : "share"}
        </span>
      </button>
    </div>
  );
}

export function PostActions({ variant = "inline", markdownContent }: PostActionsProps) {
  const { liked, likeCount, isPending, handleLike } = useLike();

  if (variant === "sidebar") {
    return (
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleLike}
          disabled={isPending}
          className={`size-10 flex items-center justify-center rounded-full border transition-colors shadow-sm ${
            liked
              ? "text-red-500 border-red-800 bg-red-900/20"
              : "text-gray-400 dark:text-[#dcddde]/40 border-black/10 dark:border-white/10 bg-card hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            favorite
          </span>
        </button>
        <ShareInline
          markdownContent={markdownContent}
          buttonClass="flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 bg-card hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-[#dcddde]/40 hover:text-green-400 shadow-sm"
          buttonSize={40}
          iconSize={20}
        />
      </div>
    );
  }

  if (variant === "bottom") {
    return (
      <button
        onClick={handleLike}
        disabled={isPending}
        className="flex flex-col items-center gap-2 group"
      >
        <div
          className={`size-16 rounded-full border flex items-center justify-center transition-all group-hover:scale-110 ${
            liked
              ? "bg-red-900/20 border-red-800"
              : "bg-card border-black/10 dark:border-white/10 group-hover:bg-red-900/10 group-hover:border-red-800/50"
          }`}
        >
          <span
            className={`material-symbols-outlined text-3xl transition-colors ${
              liked ? "text-red-500" : "text-gray-400 dark:text-[#dcddde]/40 group-hover:text-red-500"
            }`}
            style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            favorite
          </span>
        </div>
        <span
          className={`text-sm font-medium transition-colors ${
            liked ? "text-red-500" : "text-gray-400 dark:text-[#dcddde]/40 group-hover:text-red-500"
          }`}
        >
          {likeCount}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={handleLike}
        disabled={isPending}
        className={`flex items-center gap-1 px-4 py-2 rounded-full border transition-colors text-sm font-medium ${
          liked
            ? "text-red-500 border-red-800 bg-red-900/20"
            : "text-gray-400 dark:text-[#dcddde]/40 border-black/10 dark:border-white/10 hover:text-red-500 hover:border-red-800/50 hover:bg-red-900/10"
        }`}
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          favorite
        </span>
        {likeCount}
      </button>
      <ShareInline
        markdownContent={markdownContent}
        buttonClass="flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 text-gray-400 dark:text-[#dcddde]/40 hover:text-primary hover:border-primary/30 hover:bg-primary/5"
        buttonSize={36}
        iconSize={18}
      />
    </div>
  );
}
