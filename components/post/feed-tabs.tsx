"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { key: "latest", label: "최신", icon: "rss_feed" },
  { key: "popular", label: "인기", icon: "local_fire_department" },
  { key: "following", label: "팔로잉", icon: "group" },
] as const;

export function FeedTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("tab") || "latest";

  function handleTab(tab: string) {
    const params = new URLSearchParams();
    if (tab !== "latest") params.set("tab", tab);
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }

  return (
    <div className="flex items-center gap-1 mb-6">
      {TABS.map((tab) => {
        const isActive = current === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => handleTab(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-gray-400 dark:text-[#dcddde]/40 hover:text-gray-600 dark:hover:text-[#dcddde]/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
