"use client";

import Link from "next/link";
import { useState } from "react";

type SeriesPost = {
  id: string;
  title: string;
  slug: string;
  seriesOrder: number | null;
};

type SeriesNavProps = {
  seriesName: string;
  seriesSlug: string;
  posts: SeriesPost[];
  currentPostId: string;
};

export function SeriesNav({
  seriesName,
  seriesSlug,
  posts,
  currentPostId,
}: SeriesNavProps) {
  const [expanded, setExpanded] = useState(false);
  const currentIndex = posts.findIndex((p) => p.id === currentPostId);
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost =
    currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-card overflow-hidden">
      {/* 시리즈 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="material-symbols-outlined text-primary text-[20px]">
            auto_stories
          </span>
          <div>
            <div className="text-xs text-slate-500 font-medium">시리즈</div>
            <div className="text-sm font-bold text-white">{seriesName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {currentIndex + 1} / {posts.length}
          </span>
          <span
            className={`material-symbols-outlined text-[18px] text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            expand_more
          </span>
        </div>
      </button>

      {/* 글 목록 (접기/펼치기) */}
      {expanded && (
        <div className="border-t border-white/[0.08] px-5 py-3 space-y-1 max-h-[300px] overflow-y-auto">
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                post.id === currentPostId
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-slate-600 mr-2">{i + 1}.</span>
              {post.title}
            </Link>
          ))}
        </div>
      )}

      {/* 이전/다음 네비게이션 */}
      {(prevPost || nextPost) && (
        <div className="border-t border-white/[0.08] px-5 py-3 flex items-center justify-between gap-4">
          {prevPost ? (
            <Link
              href={`/posts/${prevPost.slug}`}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors min-w-0"
            >
              <span className="material-symbols-outlined text-[16px] flex-shrink-0">
                chevron_left
              </span>
              <span className="truncate">{prevPost.title}</span>
            </Link>
          ) : (
            <div />
          )}
          {nextPost ? (
            <Link
              href={`/posts/${nextPost.slug}`}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors min-w-0 text-right"
            >
              <span className="truncate">{nextPost.title}</span>
              <span className="material-symbols-outlined text-[16px] flex-shrink-0">
                chevron_right
              </span>
            </Link>
          ) : (
            <div />
          )}
        </div>
      )}
    </div>
  );
}
