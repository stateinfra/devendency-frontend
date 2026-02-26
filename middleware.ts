import { NextResponse, type NextRequest } from "next/server";

const PLATFORM_HOSTS = ["devendency.com", "www.devendency.com"];

// In-memory cache: domain → { username, expiresAt }
const cache = new Map<string, { username: string; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

function isPlatformHost(host: string): boolean {
  if (PLATFORM_HOSTS.includes(host)) return true;
  if (host === "localhost" || host.startsWith("localhost:")) return true;
  if (host.endsWith(".vercel.app")) return true;
  return false;
}

const SKIP_PREFIXES = ["/_next", "/api", "/favicon.ico", "/robots.txt", "/sitemap.xml"];

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];

  // 플랫폼 호스트는 그대로 통과
  if (isPlatformHost(hostname)) {
    return NextResponse.next();
  }

  // 정적 파일 및 API 경로는 통과
  const { pathname } = request.nextUrl;
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 캐시 확인
  const now = Date.now();
  const cached = cache.get(hostname);
  if (cached && cached.expiresAt > now) {
    const url = request.nextUrl.clone();
    url.pathname = `/users/@${cached.username}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // API로 도메인 → 유저 조회
  try {
    const apiUrl = new URL("/api/domain-map", request.url);
    apiUrl.searchParams.set("domain", hostname);

    const res = await fetch(apiUrl.toString());
    if (!res.ok) {
      return NextResponse.next();
    }

    const { username } = (await res.json()) as { username: string };

    // 캐시 저장
    cache.set(hostname, { username, expiresAt: now + CACHE_TTL });

    const url = request.nextUrl.clone();
    url.pathname = `/users/@${username}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
