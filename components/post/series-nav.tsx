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
    <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-card overflow-hidden">
      {/* 시리즈 헤더 */}
      <div className="w-full px-5 py-4 flex items-center justify-between">
        <Link
          href={`/series/${seriesSlug}`}
          className="flex items-center gap-2 text-left group min-w-0"
        >
          <span className="material-symbols-outlined text-primary text-[20px]">
            book_2
          </span>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium">시리즈</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
              {seriesName}
            </div>
          </div>
        </Link>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs text-slate-500 px-2 py-1 rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors flex-shrink-0"
        >
          <span>
            {currentIndex + 1} / {posts.length}
          </span>
          <span
            className={`material-symbols-outlined text-[18px] transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            expand_more
          </span>
        </button>
      </div>

      {/* 글 목록 (접기/펼치기) */}
      {expanded && (
        <div className="border-t border-black/[0.08] dark:border-white/[0.08] px-5 py-3 space-y-1 max-h-[300px] overflow-y-auto">
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                post.id === currentPostId
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <span className="text-gray-400 dark:text-slate-600 mr-2">{i + 1}.</span>
              {post.title}
            </Link>
          ))}
        </div>
      )}

      {/* 이전/다음 네비게이션 */}
      {(prevPost || nextPost) && (
        <div className="border-t border-black/[0.08] dark:border-white/[0.08] px-5 py-3 flex items-center justify-between gap-4">
          {prevPost ? (
            <Link
              href={`/posts/${prevPost.slug}`}
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors min-w-0"
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
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors min-w-0 text-right"
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
