"use server";

import crypto from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { sendVerificationCode } from "@/lib/resend";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function registerUser(formData: FormData) {
  const ip = await getClientIp();
  const rl = checkRateLimit("register", ip);
  if (!rl.success) return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

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

  // Generate verification code and send email
  const code = generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: { identifier: email, token: code, expires },
  });

  await sendVerificationCode(email, code);

  return { success: true, email };
}

export async function verifyEmail(email: string, code: string) {
  const ip = await getClientIp();
  const rl = checkRateLimit("verifyEmail", ip);
  if (!rl.success) return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const token = await prisma.verificationToken.findFirst({
    where: { identifier: email, token: code },
  });

  if (!token) {
    return { error: "인증 코드가 올바르지 않습니다" };
  }

  if (token.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: code } },
    });
    return { error: "인증 코드가 만료되었습니다. 재발송해주세요." };
  }

  // Mark email as verified
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  // Clean up token
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  return { success: true };
}

export async function resendVerificationCode(email: string) {
  const ip = await getClientIp();
  const rl = checkRateLimit("resendCode", ip);
  if (!rl.success) return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "등록되지 않은 이메일입니다" };
  }

  if (user.emailVerified) {
    return { error: "이미 인증된 이메일입니다" };
  }

  const code = generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: { identifier: email, token: code, expires },
  });

  await sendVerificationCode(email, code);

  return { success: true };
}

export async function resetPassword(
  token: string,
  email: string,
  newPassword: string
) {
  const ip = await getClientIp();
  const rl = checkRateLimit("resetPassword", ip);
  if (!rl.success) return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  if (newPassword.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다" };
  }

  const record = await prisma.verificationToken.findFirst({
    where: { identifier: `reset:${email}`, token },
  });

  if (!record) {
    return { error: "유효하지 않은 링크입니다" };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: { identifier: `reset:${email}`, token },
      },
    });
    return { error: "링크가 만료되었습니다. 관리자에게 다시 요청해주세요." };
  }

  const hashedPassword = await hash(newPassword, 12);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  await prisma.verificationToken.deleteMany({
    where: { identifier: `reset:${email}` },
  });

  return { success: true };
}

export async function checkEmailVerified(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  });

  if (!user) return { status: "not_found" as const };
  if (!user.emailVerified) return { status: "unverified" as const };
  return { status: "verified" as const };
}
