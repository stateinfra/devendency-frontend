"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ds";

const TAB_ITEMS = [
  { key: "latest", label: "최신", icon: "rss_feed" },
  { key: "popular", label: "인기", icon: "local_fire_department" },
  { key: "following", label: "팔로잉", icon: "group" },
];

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
    <Tabs
      items={TAB_ITEMS}
      activeKey={current}
      onChange={handleTab}
      variant="pill"
      className="mb-6"
    />
  );
}
