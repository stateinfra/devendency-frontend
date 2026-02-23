"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { profileSchema } from "@/lib/validations/profile";
import { checkRateLimit } from "@/lib/rate-limit";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const rl = checkRateLimit("updateProfile", session.user.id);
  if (!rl.success) return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const raw = {
    username: (formData.get("username") as string)?.trim(),
    name: (formData.get("name") as string)?.trim(),
    bio: (formData.get("bio") as string)?.trim() || undefined,
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { username, name, bio } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (existing && existing.id !== session.user.id) {
    return { error: "이미 사용 중인 사용자명입니다" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      username,
      name,
      bio: bio || null,
    },
  });

  return { success: true };
}
