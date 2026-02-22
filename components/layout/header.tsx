"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SearchBar } from "@/components/search/search-bar";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            Devlog
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              글 목록
            </Link>
            <Link
              href="/categories"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              카테고리
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <SearchBar />
          <ThemeToggle />
          {session?.user ? (
            <UserMenu />
          ) : (
            <Button asChild size="sm">
              <Link href="/login">로그인</Link>
            </Button>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t p-4 space-y-3">
          <SearchBar />
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              className="text-sm py-2"
              onClick={() => setMobileOpen(false)}
            >
              글 목록
            </Link>
            <Link
              href="/categories"
              className="text-sm py-2"
              onClick={() => setMobileOpen(false)}
            >
              카테고리
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session?.user ? (
              <UserMenu />
            ) : (
              <Button asChild size="sm">
                <Link href="/login">로그인</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
