import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
type AdminRole = (typeof ADMIN_ROLES)[number];

export async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { role: true },
  });
  return !!user && ADMIN_ROLES.includes(user.role as AdminRole);
}

export async function requireAdmin(sessionUserId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, sessionUserId),
    columns: { role: true },
  });
  if (!user || !ADMIN_ROLES.includes(user.role as AdminRole)) {
    throw new Error("권한이 없습니다");
  }
  return user;
}

export async function requireSuperAdmin(sessionUserId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, sessionUserId),
    columns: { role: true },
  });
  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("권한이 없습니다");
  }
  return user;
}
