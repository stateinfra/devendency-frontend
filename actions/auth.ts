"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function registerUser(formData: FormData) {
  const raw = {
    username: formData.get("username") as string,
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { username, name, email, password } = parsed.data;

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { error: "이미 사용 중인 이메일입니다" };
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    return { error: "이미 사용 중인 사용자명입니다" };
  }

  const hashedPassword = await hash(password, 12);

  await prisma.user.create({
    data: { username, name, email, password: hashedPassword },
  });

  return { success: true };
}
