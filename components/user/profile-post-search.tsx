"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfilePostSearch({
  initialQuery,
  username,
  tab,
}: {
  initialQuery?: string;
  username: string;
  tab?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    if (tab && tab !== "posts") params.set("tab", tab);
    const qs = params.toString();
    router.push(`/users/@${username}${qs ? `?${qs}` : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <div className="relative">
        <input
          type="search"
          placeholder="글 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 pl-8 pr-3 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/30 w-[180px]"
        />
        <span className="material-symbols-outlined text-[16px] text-slate-500 absolute left-2 top-1/2 -translate-y-1/2">
          search
        </span>
      </div>
    </form>
  );
}
