"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLike } from "./like-context";
import { toast } from "sonner";

type PostActionsProps = {
  variant?: "sidebar" | "bottom" | "inline";
  markdownContent?: string;
};

type ShareItem = {
  icon: string;
  label: string;
  action: () => void;
  hoverColor: string;
};

function useShareItems(markdownContent?: string, onDone?: () => void): ShareItem[] {
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
      icon: "open_in_new",
      label: "새 탭에서 열기",
      hoverColor: "#38bdf8",
      action: () => {
        window.open(window.location.href, "_blank");
        onDone?.();
      },
    },
  ];
}

function ShareButtonWithRadial({
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
  const [animated, setAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setAnimated(false);
    setTimeout(() => setOpen(false), 200);
  }, []);

  const items = useShareItems(markdownContent, close);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => setAnimated(true));
  }, [open]);

  // 우측 호형 배치: 3개를 우측에 넓게 균등 배치
  const radius = buttonSize * 1.7;
  const arcSpread = Math.PI * 0.55; // 99도 범위
  const angles = items.map((_, i) => {
    const start = -arcSpread / 2;
    return start + (arcSpread / (items.length - 1)) * i;
  });

  return (
    <>
      {/* Backdrop blur overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: animated ? 1 : 0 }}
          onClick={close}
        />
      )}

      <div ref={containerRef} className="relative z-[70]" style={{ width: buttonSize, height: buttonSize }}>
        {/* Items — hexagonal layout, equal distance & angle from center */}
        {open &&
          items.map((item, i) => {
            const angle = angles[i];
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
              <div
                key={item.icon}
                className="absolute group"
                style={{
                  left: animated ? x : 0,
                  top: animated ? y : 0,
                  opacity: animated ? 1 : 0,
                  transform: animated ? "scale(1)" : "scale(0.3)",
                  transition: "all 300ms ease",
                  transitionDelay: `${i * 70}ms`,
                }}
              >
                <button
                  onClick={item.action}
                  className="share-radial-btn flex items-center gap-0 overflow-hidden rounded-full border border-white/10 bg-[#2a2a2a] text-[#dcddde]/60 transition-all duration-300 shadow-lg group-hover:gap-1.5"
                  style={{
                    height: buttonSize,
                    minWidth: buttonSize,
                    padding: `0 ${buttonSize / 2 - iconSize / 2}px`,
                    "--hover-color": item.hoverColor,
                  } as React.CSSProperties}
                >
                  <span className="material-symbols-outlined shrink-0" style={{ fontSize: iconSize }}>
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap text-[11px] font-medium max-w-0 group-hover:max-w-[120px] overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100">
                    {item.label}
                  </span>
                </button>
              </div>
            );
          })}

        {/* Share button */}
        <button
          onClick={() => (open ? close() : setOpen(true))}
          className={`${buttonClass} relative z-10 transition-all duration-200 ${
            open ? "text-primary border-primary/30 bg-primary/10" : ""
          }`}
          style={{ width: buttonSize, height: buttonSize }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: iconSize }}>
            share
          </span>
        </button>
      </div>
    </>
  );
}

export function PostActions({ variant = "inline", markdownContent }: PostActionsProps) {
  const { liked, likeCount, isPending, handleLike } = useLike();

  if (variant === "sidebar") {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={handleLike}
          disabled={isPending}
          className={`size-10 flex items-center justify-center rounded-full border transition-colors shadow-sm ${
            liked
              ? "text-red-500 border-red-800 bg-red-900/20"
              : "text-[#dcddde]/40 border-white/10 bg-card hover:text-red-500 hover:bg-white/5"
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            favorite
          </span>
        </button>
        <ShareButtonWithRadial
          markdownContent={markdownContent}
          buttonClass="flex items-center justify-center rounded-full border border-white/10 bg-card hover:bg-white/5 text-[#dcddde]/40 hover:text-green-400 shadow-sm"
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
              : "bg-card border-white/10 group-hover:bg-red-900/10 group-hover:border-red-800/50"
          }`}
        >
          <span
            className={`material-symbols-outlined text-3xl transition-colors ${
              liked ? "text-red-500" : "text-[#dcddde]/40 group-hover:text-red-500"
            }`}
            style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            favorite
          </span>
        </div>
        <span
          className={`text-sm font-medium transition-colors ${
            liked ? "text-red-500" : "text-[#dcddde]/40 group-hover:text-red-500"
          }`}
        >
          {likeCount}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLike}
        disabled={isPending}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border transition-colors text-sm font-medium ${
          liked
            ? "text-red-500 border-red-800 bg-red-900/20"
            : "text-[#dcddde]/40 border-white/10 hover:text-red-500 hover:border-red-800/50 hover:bg-red-900/10"
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
      <ShareButtonWithRadial
        markdownContent={markdownContent}
        buttonClass="flex items-center justify-center rounded-full border border-white/10 text-[#dcddde]/40 hover:text-primary hover:border-primary/30 hover:bg-primary/5"
        buttonSize={36}
        iconSize={18}
      />
    </div>
  );
}
