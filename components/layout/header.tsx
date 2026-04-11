"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { useState, useEffect, useRef } from "react";

function CompactActions({ session, openSearch }: { session: any; openSearch: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        aria-label="검색"
        onClick={openSearch}
        className="size-9 flex items-center justify-center rounded-full bg-black/[0.06] dark:bg-white/[0.08] hover:bg-black/[0.1] dark:hover:bg-white/[0.14] border border-black/[0.1] dark:border-white/[0.1] text-gray-600 dark:text-slate-300 transition-all"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20, width: 20, height: 20, fontVariationSettings: "'opsz' 20, 'wght' 400" }}>search</span>
      </button>
      {session?.user && (
        <Link
          href="/dashboard/posts/new"
          aria-label="글쓰기"
          className="size-9 flex items-center justify-center rounded-full bg-black/[0.06] dark:bg-white/[0.08] hover:bg-black/[0.1] dark:hover:bg-white/[0.14] border border-black/[0.1] dark:border-white/[0.1] text-gray-600 dark:text-slate-300 transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, width: 20, height: 20, fontVariationSettings: "'opsz' 20, 'wght' 400" }}>edit</span>
        </Link>
      )}
      {session?.user ? (
        <UserMenu />
      ) : (
        <Link
          href="/login"
          aria-label="로그인"
          className="size-9 flex items-center justify-center rounded-full bg-black/[0.06] dark:bg-white/[0.08] hover:bg-black/[0.1] dark:hover:bg-white/[0.14] border border-black/[0.1] dark:border-white/[0.1] text-gray-600 dark:text-slate-300 transition-all"
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
  const { theme } = useTheme();
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

  // compact 헤더: 스크롤 다운 시 숨기고, 스크롤 업 시 표시
  const [compactHidden, setCompactHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!compact) return;
    function onScroll() {
      // ToC 클릭으로 인한 스크롤이면 헤더 강제 표시
      if ((window as any).__tocScrolling) {
        setCompactHidden(false);
        lastScrollY.current = window.scrollY;
        return;
      }
      const y = window.scrollY;
      // 200px 이상 스크롤 & 아래로 스크롤 중이면 숨김
      if (y > 200 && y > lastScrollY.current) {
        setCompactHidden(true);
      } else {
        setCompactHidden(false);
      }
      lastScrollY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [compact]);

  // 홈 페이지 스크롤 위치 저장
  useEffect(() => {
    if (pathname === "/" || pathname === "") {
      const saved = sessionStorage.getItem("homeScrollY");
      if (saved) {
        window.scrollTo(0, parseInt(saved, 10));
        sessionStorage.removeItem("homeScrollY");
      }
    }
  }, [pathname]);

  function goHome() {
    router.push("/", { scroll: false });
  }

  // 홈 페이지에서 나갈 때 스크롤 위치 저장
  useEffect(() => {
    if (pathname !== "/" && pathname !== "") return;
    function saveScroll() {
      sessionStorage.setItem("homeScrollY", String(window.scrollY));
    }
    window.addEventListener("scroll", saveScroll, { passive: true });
    return () => window.removeEventListener("scroll", saveScroll);
  }, [pathname]);

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full border-b transition-all duration-300 ease-in-out isolate"
        style={{
          borderColor: compact ? "transparent" : theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          background: compact ? (theme === "dark" ? "rgba(38,38,38,0.4)" : "rgba(255,255,255,0.4)") : (theme === "dark" ? "rgba(38,38,38,0.8)" : "rgba(255,255,255,0.8)"),
          backdropFilter: "blur(12px)",
          transform: compact && compactHidden ? "translateY(-100%)" : "translateY(0)",
          opacity: compact && compactHidden ? 0 : 1,
          pointerEvents: compact && compactHidden ? "none" : "auto",
        }}
      >
        <div
          className="w-full px-4 sm:px-6 md:px-12 lg:px-16 relative transition-all duration-200 ease-in-out"
          style={{
            height: compact ? 48 : 56,
            marginTop: compact ? 8 : 0,
          }}
        >
          {/* Normal 헤더 - compact일 때 페이드아웃 */}
          <div
            className="absolute inset-0 px-4 sm:px-6 md:px-12 lg:px-16 flex items-center justify-between transition-all duration-200 ease-in-out"
            style={{
              opacity: compact ? 0 : 1,
              pointerEvents: compact ? "none" : "auto",
              transform: compact ? "scale(0.95)" : "scale(1)",
            }}
          >
            <Link href="/" className="flex items-center group">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">Devendency</h1>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <button
                aria-label="검색"
                onClick={openSearch}
                className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">search</span>
              </button>
              <ThemeToggle />
              {session?.user && (
                <Link
                  href="/dashboard/posts/new"
                  className="flex items-center justify-center h-9 px-4 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-slate-200 text-sm font-medium transition-all"
                >
                  글쓰기
                </Link>
              )}
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

            <div className="flex md:hidden items-center gap-1.5">
              <button
                aria-label="검색"
                onClick={openSearch}
                className="size-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>search</span>
              </button>
              {session?.user && (
                <Link
                  href="/dashboard/posts/new"
                  aria-label="글쓰기"
                  className="size-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                </Link>
              )}
              <div className="ml-1.5">
                {session?.user ? (
                  <UserMenu />
                ) : (
                  <Link
                    href="/login"
                    className="size-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Compact 헤더 - compact일 때 페이드인 (그리드 정렬) */}
          <div
            className="absolute inset-0 px-4 sm:px-6 md:px-12 lg:px-16 transition-all duration-200 ease-in-out"
            style={{
              opacity: compact ? 1 : 0,
              pointerEvents: compact ? "auto" : "none",
              transform: compact ? "scale(1)" : "scale(1.05)",
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-[1200px] mx-auto h-full items-center">
              <div className="hidden lg:flex lg:col-span-3">
                <button
                  onClick={goHome}
                  className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span className="text-sm whitespace-nowrap">홈으로 돌아가기</span>
                </button>
              </div>
              <div className="col-span-1 lg:col-span-9 max-w-[760px] mx-auto w-full flex items-center justify-between">
                <button
                  onClick={goHome}
                  className="flex lg:hidden items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
            <div className="flex items-center gap-3 h-14 px-5 rounded-2xl bg-white dark:bg-[#2a2a2a] border border-black/[0.1] dark:border-white/[0.1] shadow-2xl">
              <span className="material-symbols-outlined text-[22px] text-slate-500">search</span>
              <input
                ref={inputRef}
                type="search"
                placeholder="검색어를 입력하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-base text-gray-900 dark:text-white placeholder:text-slate-500 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-slate-600 border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.04]">
                ESC
              </kbd>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
