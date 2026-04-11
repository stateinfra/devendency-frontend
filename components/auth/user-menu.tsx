"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Avatar } from "@/components/ds";

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session?.user) return null;

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const menuItems = [
    {
      href: session.user.username ? `/users/@${session.user.username}` : "/dashboard/settings",
      icon: "person",
      label: "내 프로필",
    },
    {
      href: "/dashboard/series",
      icon: "auto_stories",
      label: "시리즈 관리",
    },
    {
      href: "/dashboard/settings",
      icon: "settings",
      label: "설정",
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all focus:outline-none"
      >
        <Avatar
          src={session.user.image || undefined}
          initial={initials}
          size="md"
        />
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 ${open ? "block" : "hidden"}`}
        onClick={() => setOpen(false)}
      />

      {/* Menu */}
      <div
        className={`absolute right-0 mt-2 w-52 z-50 origin-top-right transition-all duration-200 ease-out ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="rounded-xl bg-white dark:bg-[#1e1e1e] border border-black/[0.06] dark:border-white/[0.06] shadow-xl shadow-black/[0.08] dark:shadow-black/[0.3] overflow-hidden">
          {/* User info */}
          <div className="px-3 py-2.5 bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.03] dark:to-transparent">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={session.user.image || undefined}
                initial={initials}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-[#e4e5e7] truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-[#dcddde]/35 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-black/[0.06] dark:bg-white/[0.06]" />

          {/* Menu items */}
          <div className="py-1 px-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-600 dark:text-[#dcddde]/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-[#e4e5e7] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] opacity-60">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-black/[0.06] dark:bg-white/[0.06]" />

          {/* Sign out */}
          <div className="py-1 px-1">
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded-lg text-sm text-gray-400 dark:text-[#dcddde]/40 hover:bg-red-50 dark:hover:bg-red-500/[0.08] hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
