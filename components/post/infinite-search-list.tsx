"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SearchResult } from "@/components/post/search-result-item";
import { Spinner } from "@/components/ds";

type SearchItem = {
  slug: string;
  title: string;
  snippet: string;
  author: { username: string | null; name: string | null; image: string | null };
  publishedAt: Date | string | null;
  createdAt: Date | string;
  likeCount: number;
  commentCount: number;
  tags: string[];
};

type Props = {
  query: string;
  initialItems: SearchItem[];
  initialHasMore: boolean;
  terms: string[];
};

export function InfiniteSearchList({
  query,
  initialItems,
  initialHasMore,
  terms,
}: Props) {
  const [items, setItems] = useState<SearchItem[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lockRef = useRef(false);

  useEffect(() => {
    setItems(initialItems);
    setPage(1);
    setHasMore(initialHasMore);
    lockRef.current = false;
  }, [query, initialItems, initialHasMore]);

  const loadMore = useCallback(async () => {
    if (lockRef.current || !hasMore) return;
    lockRef.current = true;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&page=${nextPage}`,
      );
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as {
        items: SearchItem[];
        hasMore: boolean;
      };
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.slug));
        const fresh = data.items.filter((p) => !seen.has(p.slug));
        return [...prev, ...fresh];
      });
      setPage(nextPage);
      setHasMore(data.hasMore);
    } catch {
      /* retry on next intersection */
    } finally {
      lockRef.current = false;
      setLoading(false);
    }
  }, [query, page, hasMore]);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <>
      <div className="space-y-2">
        {items.map((p) => (
          <SearchResult
            key={p.slug}
            post={{
              ...p,
              publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
              createdAt: new Date(p.createdAt),
            }}
            terms={terms}
          />
        ))}
      </div>
      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex justify-center py-10"
          aria-hidden={!loading}
        >
          {loading && <Spinner />}
        </div>
      )}
    </>
  );
}
