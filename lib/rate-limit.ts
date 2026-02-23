import { headers } from "next/headers";

const store = new Map<string, { count: number; resetAt: number }>();

// 5분마다 만료된 엔트리 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

export const RATE_LIMITS = {
  register:     { limit: 3,  windowMs: 60 * 60 * 1000 },      // 3/hr
  login:        { limit: 5,  windowMs: 15 * 60 * 1000 },      // 5/15min
  verifyEmail:  { limit: 5,  windowMs: 10 * 60 * 1000 },      // 5/10min
  resendCode:   { limit: 3,  windowMs: 10 * 60 * 1000 },      // 3/10min
  resetPassword:{ limit: 3,  windowMs: 60 * 60 * 1000 },      // 3/hr
  createPost:   { limit: 10, windowMs: 60 * 60 * 1000 },      // 10/hr
  updatePost:   { limit: 30, windowMs: 60 * 60 * 1000 },      // 30/hr
  deletePost:   { limit: 10, windowMs: 60 * 60 * 1000 },      // 10/hr
  createComment:{ limit: 20, windowMs: 10 * 60 * 1000 },      // 20/10min
  deleteComment:{ limit: 20, windowMs: 10 * 60 * 1000 },      // 20/10min
  toggleLike:   { limit: 60, windowMs: 60 * 1000 },           // 60/min
  toggleFollow: { limit: 30, windowMs: 60 * 1000 },           // 30/min
  upload:       { limit: 20, windowMs: 60 * 60 * 1000 },      // 20/hr
  updateProfile:{ limit: 10, windowMs: 60 * 60 * 1000 },      // 10/hr
  updateAvatar: { limit: 10, windowMs: 60 * 60 * 1000 },      // 10/hr
} as const;

export function checkRateLimit(
  action: keyof typeof RATE_LIMITS,
  identifier: string
): { success: boolean; remaining: number } {
  const config = RATE_LIMITS[action];
  return rateLimit(`${action}:${identifier}`, config.limit, config.windowMs);
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}
