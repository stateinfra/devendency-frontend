"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const name = formData.get("name") as string;
  const bio = formData.get("bio") as string;

  if (!name?.trim()) {
    return { error: "이름을 입력해주세요" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name.trim(), bio: bio?.trim() || null },
  });

  return { success: true };
}
