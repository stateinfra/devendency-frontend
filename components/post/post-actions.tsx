"use client";

import { useLike } from "./like-context";
import { toast } from "sonner";

type PostActionsProps = {
  variant?: "sidebar" | "bottom" | "inline";
};

export function PostActions({ variant = "inline" }: PostActionsProps) {
  const { liked, likeCount, isPending, handleLike } = useLike();

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("링크가 복사되었습니다");
  }

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
        <button
          onClick={handleShare}
          className="size-10 flex items-center justify-center rounded-full border border-white/10 bg-card hover:bg-white/5 text-[#dcddde]/40 hover:text-green-400 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
        </button>
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
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 text-[#dcddde]/40 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm font-medium"
      >
        <span className="material-symbols-outlined text-[18px]">share</span>
        공유
      </button>
    </div>
  );
}
