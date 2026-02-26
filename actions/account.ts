"use server";

import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth, signOut } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function requestAccountDeletion(formData: FormData) {
  const ip = await getClientIp();
  const rl = checkRateLimit("deleteAccount", ip);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다." };

  const password = formData.get("password") as string;
  if (!password) return { error: "비밀번호를 입력해주세요." };

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { password: true },
  });

  if (!user?.password) {
    return { error: "소셜 로그인 계정은 비밀번호 확인이 불가합니다." };
  }

  const isValid = await compare(password, user.password);
  if (!isValid) return { error: "비밀번호가 올바르지 않습니다." };

  const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일 후

  await db
    .update(users)
    .set({ deletionScheduledAt: deletionDate, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  await signOut({ redirect: false });

  return { success: true };
}

export async function cancelAccountDeletion() {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다." };

  await db
    .update(users)
    .set({ deletionScheduledAt: null, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return { success: true };
}

export async function getAccountDeletionStatus() {
  const session = await auth();
  if (!session?.user) return { deletionScheduledAt: null };

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { deletionScheduledAt: true },
  });

  return { deletionScheduledAt: user?.deletionScheduledAt ?? null };
}
