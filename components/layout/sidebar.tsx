"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const sidebarItems = [
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

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role ?? "");
  const items = isAdmin
    ? [...sidebarItems, ...adminItems]
    : sidebarItems;

  return (
    <aside className="w-64 border-r border-white/[0.08] min-h-[calc(100vh-4rem)] p-4 hidden lg:block bg-card">
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
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
