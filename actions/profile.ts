"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { usernameSchema } from "@/lib/validations/auth";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const username = formData.get("username") as string;
  const name = formData.get("name") as string;
  const bio = formData.get("bio") as string;

  if (!name?.trim()) {
    return { error: "이름을 입력해주세요" };
  }

  if (!username?.trim()) {
    return { error: "사용자명을 입력해주세요" };
  }

  const usernameValid = usernameSchema.safeParse(username.trim());
  if (!usernameValid.success) {
    return { error: usernameValid.error.issues[0].message };
  }

  const existing = await prisma.user.findUnique({
    where: { username: username.trim() },
    select: { id: true },
  });
  if (existing && existing.id !== session.user.id) {
    return { error: "이미 사용 중인 사용자명입니다" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      username: username.trim(),
      name: name.trim(),
      bio: bio?.trim() || null,
    },
  });

  return { success: true };
}
