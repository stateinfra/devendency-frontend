"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ds";
import { useMemo } from "react";
import { escapeRegex } from "@/lib/search-snippet";

type SearchResultItem = {
  slug: string;
  title: string;
  snippet: string;
  author: { username: string | null; name: string | null; image: string | null };
  publishedAt: Date | null;
  createdAt: Date;
  likeCount: number;
  commentCount: number;
  tags: string[];
};

function highlight(text: string, terms: string[]) {
  if (!text || terms.length === 0) return text;
  const re = new RegExp(`(${terms.map(escapeRegex).join("|")})`, "gi");
  const parts = text.split(re);
  return parts.map((p, i) =>
    re.test(p) ? (
      <mark
        key={i}
        className="bg-primary/20 text-primary rounded px-0.5"
      >
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export function SearchResult({ post, terms }: { post: SearchResultItem; terms: string[] }) {
  const titleHl = useMemo(() => highlight(post.title, terms), [post.title, terms]);
  const snippetHl = useMemo(() => highlight(post.snippet, terms), [post.snippet, terms]);

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="block rounded-xl p-4 -m-1 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
    >
      <article className="space-y-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug break-keep line-clamp-2">
          {titleHl}
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2 break-keep">
          {snippetHl}
        </p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 5).map((t) => (
              <span
                key={t}
                className="text-[11px] px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.06] text-slate-500"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#dcddde]/30 pt-1">
          <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <Avatar
              src={post.author.image || undefined}
              initial={post.author.name?.[0]?.toUpperCase() || "A"}
              size="xs"
            />
            <span>{post.author.name}</span>
          </span>
          <span>&middot;</span>
          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
          <span>&middot;</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
              favorite
            </span>
            {post.likeCount}
          </span>
          <span>&middot;</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
              chat_bubble
            </span>
            {post.commentCount}
          </span>
        </div>
      </article>
    </Link>
  );
}
