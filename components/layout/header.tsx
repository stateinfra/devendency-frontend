"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserMenu } from "@/components/auth/user-menu";
import { useState, useEffect, useRef } from "react";

function CompactActions({ session, openSearch }: { session: any; openSearch: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        aria-label="검색"
        onClick={openSearch}
        className="size-9 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-slate-300 transition-all"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20, width: 20, height: 20, fontVariationSettings: "'opsz' 20, 'wght' 400" }}>search</span>
      </button>
      <Link
        href={session?.user ? "/dashboard/posts/new" : "/login"}
        aria-label="글쓰기"
        className="size-9 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-slate-300 transition-all"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20, width: 20, height: 20, fontVariationSettings: "'opsz' 20, 'wght' 400" }}>edit</span>
      </Link>
      {session?.user ? (
        <UserMenu />
      ) : (
        <Link
          href="/login"
          aria-label="로그인"
          className="size-9 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-slate-300 transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, width: 20, height: 20, fontVariationSettings: "'opsz' 20, 'wght' 400" }}>person</span>
        </Link>
      )}
    </div>
  );
}

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide header on editor pages for immersive writing
  if (
    pathname.startsWith("/dashboard/posts/new") ||
    /\/dashboard\/posts\/[^/]+\/edit/.test(pathname)
  ) {
    return null;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  function openSearch() {
    setSearchOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!searchOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeSearch();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [searchOpen]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const compact = pathname.startsWith("/posts/");

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full border-b transition-all duration-200 ease-in-out"
        style={{
          borderColor: compact ? "transparent" : "rgba(255,255,255,0.08)",
          background: compact ? "rgba(38,38,38,0.4)" : "rgba(38,38,38,0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          className="w-full px-6 md:px-12 lg:px-16 relative transition-all duration-200 ease-in-out"
          style={{
            height: compact ? 56 : 64,
            marginTop: compact ? 8 : 0,
          }}
        >
          {/* Normal 헤더 - compact일 때 페이드아웃 */}
          <div
            className="absolute inset-0 px-6 md:px-12 lg:px-16 flex items-center justify-between transition-all duration-200 ease-in-out"
            style={{
              opacity: compact ? 0 : 1,
              pointerEvents: compact ? "none" : "auto",
              transform: compact ? "scale(0.95)" : "scale(1)",
            }}
          >
            <Link href="/" className="flex items-center gap-2 group">
              <div className="size-8 text-primary transition-transform group-hover:rotate-12">
                <svg className="size-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor" />
                </svg>
              </div>
              <h1 className="hidden md:block text-xl font-bold tracking-tight text-white">Devendency</h1>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <button
                aria-label="검색"
                onClick={openSearch}
                className="size-10 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">search</span>
              </button>
              <Link
                href={session?.user ? "/dashboard/posts/new" : "/login"}
                className="flex items-center justify-center h-9 px-4 rounded-full border border-white/10 hover:bg-white/10 text-slate-200 text-sm font-medium transition-all"
              >
                글쓰기
              </Link>
              {session?.user ? (
                <UserMenu />
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center h-9 px-4 rounded-full bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-all"
                >
                  로그인
                </Link>
              )}
            </div>

            <div className="flex md:hidden items-center gap-1">
              <button
                aria-label="검색"
                onClick={openSearch}
                className="size-10 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">search</span>
              </button>
              <Link
                href={session?.user ? "/dashboard/posts/new" : "/login"}
                aria-label="글쓰기"
                className="size-10 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">edit</span>
              </Link>
              {session?.user ? (
                <UserMenu />
              ) : (
                <Link
                  href="/login"
                  className="size-10 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-300 transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px]">person</span>
                </Link>
              )}
            </div>
          </div>

          {/* Compact 헤더 - compact일 때 페이드인 (그리드 정렬) */}
          <div
            className="absolute inset-0 px-6 md:px-12 lg:px-16 transition-all duration-200 ease-in-out"
            style={{
              opacity: compact ? 1 : 0,
              pointerEvents: compact ? "auto" : "none",
              transform: compact ? "scale(1)" : "scale(1.05)",
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-[1200px] mx-auto h-full items-center">
              <div className="hidden lg:flex lg:col-span-3">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span className="text-sm whitespace-nowrap">홈으로 돌아가기</span>
                </button>
              </div>
              <div className="col-span-1 lg:col-span-9 max-w-[760px] mx-auto w-full flex items-center justify-between">
                <button
                  onClick={() => router.back()}
                  className="flex lg:hidden items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span className="text-sm whitespace-nowrap">홈으로 돌아가기</span>
                </button>
                <div className="hidden lg:block" />
                <CompactActions session={session} openSearch={openSearch} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center search-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSearch();
          }}
        >
          <form
            onSubmit={handleSearch}
            className="w-full max-w-lg mx-4 search-modal"
          >
            <div className="flex items-center gap-3 h-14 px-5 rounded-2xl bg-[#2a2a2a] border border-white/[0.1] shadow-2xl">
              <span className="material-symbols-outlined text-[22px] text-slate-500">search</span>
              <input
                ref={inputRef}
                type="search"
                placeholder="검색어를 입력하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-base text-white placeholder:text-slate-500 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-slate-600 border border-white/[0.08] bg-white/[0.04]">
                ESC
              </kbd>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
