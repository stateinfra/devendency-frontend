"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Announcement = { title: string; slug: string } | null;

export function AnnouncementBar() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState<Announcement>(null);

  useEffect(() => {
    if (pathname !== "/") return;
    fetch("/api/announcement")
      .then((r) => r.json())
      .then((data) => setAnnouncement(data.post ?? null))
      .catch(() => {});
  }, [pathname]);

  if (pathname !== "/" || !announcement) return null;

  return (
    <div className="w-full bg-[#7f6df2]/10 dark:bg-[#7f6df2]/[0.07] border-b border-[#7f6df2]/10">
      <Link
        href={`/posts/${announcement.slug}`}
        className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <span className="material-symbols-outlined text-[14px]">campaign</span>
        <span className="font-medium truncate">{announcement.title}</span>
      </Link>
    </div>
  );
}
