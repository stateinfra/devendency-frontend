"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ds";

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
      <Input
        type="search"
        placeholder="글 검색..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        size="sm"
        className="w-[180px]"
      />
    </form>
  );
}
