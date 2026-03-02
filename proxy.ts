import { NextResponse, type NextRequest } from "next/server";

const PLATFORM_HOSTS = ["devendency.com", "www.devendency.com"];

// In-memory cache: domain → { username, logo, expiresAt }
const cache = new Map<
  string,
  { username: string; logo: string | null; expiresAt: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

function isPlatformHost(host: string): boolean {
  if (PLATFORM_HOSTS.includes(host)) return true;
  if (host === "localhost" || host.startsWith("localhost:")) return true;
  if (host.endsWith(".vercel.app")) return true;
  return false;
}

const SKIP_PREFIXES = ["/_next", "/api", "/favicon.ico", "/robots.txt", "/sitemap.xml"];

// 커스텀 도메인에서도 그대로 통과시킬 기존 앱 경로
const PASSTHROUGH_PREFIXES = ["/posts", "/tags", "/search", "/login", "/register", "/feed.xml"];

function setDomainCookies(
  response: NextResponse,
  domain: string,
  logo: string | null,
) {
  response.cookies.set("x-custom-domain", domain, { path: "/", httpOnly: true });
  response.cookies.set("x-custom-logo", logo || "", { path: "/", httpOnly: true });
  return response;
}

export async function proxy(request: NextRequest) {
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

  // 도메인 정보 조회 (캐시 또는 API)
  const now = Date.now();
  let domainInfo = cache.get(hostname);

  if (!domainInfo || domainInfo.expiresAt <= now) {
    try {
      const apiUrl = new URL("/api/domain-map", request.url);
      apiUrl.searchParams.set("domain", hostname);

      const res = await fetch(apiUrl.toString());
      if (!res.ok) return NextResponse.next();

      const { username, logo } = (await res.json()) as {
        username: string;
        logo: string | null;
      };

      domainInfo = { username, logo, expiresAt: now + CACHE_TTL };
      cache.set(hostname, domainInfo);
    } catch {
      return NextResponse.next();
    }
  }

  // 기존 앱 경로는 rewrite 없이 통과 (쿠키만 추가)
  if (PASSTHROUGH_PREFIXES.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next();
    return setDomainCookies(response, hostname, domainInfo.logo);
  }

  // 루트는 프로필 페이지로 rewrite
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/users/@${domainInfo.username}` : pathname;
  const response = NextResponse.rewrite(url);
  return setDomainCookies(response, hostname, domainInfo.logo);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
