"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function toggleFollow(targetUserId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };
  if (session.user.id === targetUserId) return { error: "자신을 팔로우할 수 없습니다" };

  const rl = checkRateLimit("toggleFollow", session.user.id);
  if (!rl.success) return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    },
  });

  if (existing) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });
  } else {
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { username: true },
  });
  if (targetUser?.username) {
    revalidatePath(`/users/@${targetUser.username}`);
  }

  return { success: true, following: !existing };
}
