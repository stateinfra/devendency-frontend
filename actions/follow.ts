"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { follows, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function toggleFollow(targetUserId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };
  if (session.user.id === targetUserId)
    return { error: "자신을 팔로우할 수 없습니다" };

  const rl = checkRateLimit("toggleFollow", session.user.id);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const existing = await db.query.follows.findFirst({
    where: and(
      eq(follows.followerId, session.user.id),
      eq(follows.followingId, targetUserId),
    ),
  });

  if (existing) {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, session.user.id),
          eq(follows.followingId, targetUserId),
        ),
      );
  } else {
    await db.insert(follows).values({
      followerId: session.user.id,
      followingId: targetUserId,
    });
  }

  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
    columns: { username: true },
  });
  if (targetUser?.username) {
    revalidatePath(`/users/@${targetUser.username}`);
  }

  return { success: true, following: !existing };
}
