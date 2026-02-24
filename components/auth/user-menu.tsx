"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="size-9 rounded-full bg-gray-700 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all focus:outline-none"
      >
        {session.user.image ? (
          <img
            alt={session.user.name || "User"}
            className="size-full object-cover"
            src={session.user.image}
          />
        ) : (
          <span className="size-full flex items-center justify-center text-sm font-bold text-slate-300">
            {initials}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 py-1 bg-[#2a2a2a] rounded-xl border border-white/[0.08] shadow-lg z-50">
          <div className="px-3 py-2 border-b border-white/[0.08]">
            <p className="text-sm font-medium text-[#dcddde]">{session.user.name}</p>
            <p className="text-xs text-[#dcddde]/40 truncate">{session.user.email}</p>
          </div>
          <Link
            href={session.user.username ? `/users/@${session.user.username}` : "/dashboard/settings"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#dcddde]/70 hover:bg-white/[0.06] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            내 프로필
          </Link>
          <Link
            href="/dashboard/series"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#dcddde]/70 hover:bg-white/[0.06] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">auto_stories</span>
            시리즈 관리
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#dcddde]/70 hover:bg-white/[0.06] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            설정
          </Link>
          <div className="border-t border-white/[0.08] mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-[#dcddde]/70 hover:bg-white/[0.06] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
