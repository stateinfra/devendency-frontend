export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // 개발 환경에서만 키 없이 통과 허용
    if (process.env.NODE_ENV !== "production") return true;
    console.error("[turnstile] TURNSTILE_SECRET_KEY is not set in production");
    return false;
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (e) {
    console.error("[turnstile] verification failed", e);
    return false;
  }
}

/** 스팸 매칭용 정규화: NFKC + 소문자 + 모든 공백/제어문자 제거 + 보이지 않는 문자 제거 */
export function normalizeForFilter(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "");
}
