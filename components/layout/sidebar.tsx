"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const sidebarItems = [
  { href: "/dashboard/series", label: "시리즈 관리", icon: "auto_stories" },
  { href: "/dashboard/settings", label: "설정", icon: "settings" },
];

const adminItems = [
  { href: "/dashboard/admin", label: "관리자", icon: "shield_person" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Hide sidebar on editor pages
  if (
    pathname.startsWith("/dashboard/posts/new") ||
    /\/dashboard\/posts\/[^/]+\/edit/.test(pathname)
  ) {
    return null;
  }

  const isAdmin = session?.user?.role === "ADMIN";
  const items = isAdmin
    ? [...sidebarItems, ...adminItems]
    : sidebarItems;

  return (
    <aside className="w-60 min-h-[calc(100vh-4rem)] pt-6 pb-4 pl-4 pr-8 hidden lg:block border-r border-black/[0.06] dark:border-white/[0.06]">
      <nav className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-400 dark:text-[#dcddde]/40 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-[#dcddde]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
