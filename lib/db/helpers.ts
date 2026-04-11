import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { role: true },
  });
  return !!user && user.role === "ADMIN";
}

export async function requireAdmin(sessionUserId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, sessionUserId),
    columns: { role: true },
  });
  if (!user || user.role !== "ADMIN") {
    throw new Error("권한이 없습니다");
  }
  return user;
}
