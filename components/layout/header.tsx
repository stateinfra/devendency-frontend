"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserMenu } from "@/components/auth/user-menu";
import { useState } from "react";

type HeaderProps = {
  customDomain?: string | null;
  customLogo?: string | null;
};

export function Header({ customDomain, customLogo }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isCustomDomain = !!customDomain;

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#262626]/80 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          {isCustomDomain && customLogo ? (
            <Image
              src={customLogo}
              alt="Logo"
              width={32}
              height={32}
              className="size-8 rounded object-contain"
            />
          ) : (
            <div className="size-8 text-primary transition-transform group-hover:rotate-12">
              <svg className="size-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor" />
              </svg>
            </div>
          )}
          {!isCustomDomain && (
            <h1 className="hidden md:block text-xl font-bold tracking-tight text-white">Devendency</h1>
          )}
        </Link>

        {isCustomDomain ? (
          /* 커스텀 도메인: Devendency 이동 버튼만 표시 */
          <a
            href="https://devendency.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 h-9 px-4 rounded-full border border-white/10 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors"
          >
            <svg className="size-4 text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor" />
            </svg>
            <span className="hidden md:inline">Devendency에서 보기</span>
          </a>
        ) : (
          <>
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2 sm:gap-4">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="search"
                    placeholder="검색..."
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => !searchQuery && setSearchOpen(false)}
                    className="h-9 px-3 rounded-full border border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 w-[200px]"
                  />
                </form>
              ) : (
                <button
                  aria-label="검색"
                  onClick={() => setSearchOpen(true)}
                  className="size-10 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-300 transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px]">search</span>
                </button>
              )}

              <Link
                href={session?.user ? "/dashboard/posts/new" : "/login"}
                className="flex items-center justify-center h-9 px-4 rounded-full border border-white/10 hover:bg-white/10 text-slate-200 text-sm font-medium transition-colors"
              >
                글쓰기
              </Link>

              {session?.user ? (
                <UserMenu />
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center h-9 px-4 rounded-full bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors"
                >
                  로그인
                </Link>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-1">
              <button
                aria-label="검색"
                onClick={() => setSearchOpen(!searchOpen)}
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
          </>
        )}
      </div>

      {/* Mobile search bar (플랫폼 호스트만) */}
      {!isCustomDomain && searchOpen && (
        <div className="md:hidden border-t border-white/[0.08] p-3">
          <form onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="검색..."
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-4 rounded-full border border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>
        </div>
      )}
    </header>
  );
}
