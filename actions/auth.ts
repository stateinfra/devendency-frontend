"use server";

import crypto from "crypto";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { registerSchema } from "@/lib/validations/auth";
import { sendVerificationCode } from "@/lib/resend";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function registerUser(formData: FormData) {
  const ip = await getClientIp();
  const rl = checkRateLimit("register", ip);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

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

  const existingEmail = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existingEmail) {
    return { error: "이미 사용 중인 이메일입니다" };
  }

  const existingUsername = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (existingUsername) {
    return { error: "이미 사용 중인 사용자명입니다" };
  }

  const hashedPassword = await hash(password, 12);

  await db.insert(users).values({
    username,
    name,
    email,
    password: hashedPassword,
  });

  // Generate verification code and send email
  const code = generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete any existing tokens for this email
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  await db.insert(verificationTokens).values({
    identifier: email,
    token: code,
    expires,
  });

  await sendVerificationCode(email, code);

  return { success: true, email };
}

export async function verifyEmail(email: string, code: string) {
  const ip = await getClientIp();
  const rl = checkRateLimit("verifyEmail", ip);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const token = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, email),
      eq(verificationTokens.token, code),
    ),
  });

  if (!token) {
    return { error: "인증 코드가 올바르지 않습니다" };
  }

  if (token.expires < new Date()) {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, code),
        ),
      );
    return { error: "인증 코드가 만료되었습니다. 재발송해주세요." };
  }

  // Mark email as verified
  await db
    .update(users)
    .set({ emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(users.email, email));

  // Clean up token
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  return { success: true };
}

export async function resendVerificationCode(email: string) {
  const ip = await getClientIp();
  const rl = checkRateLimit("resendCode", ip);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user) {
    return { error: "등록되지 않은 이메일입니다" };
  }

  if (user.emailVerified) {
    return { error: "이미 인증된 이메일입니다" };
  }

  const code = generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  await db.insert(verificationTokens).values({
    identifier: email,
    token: code,
    expires,
  });

  await sendVerificationCode(email, code);

  return { success: true };
}

export async function resetPassword(
  token: string,
  email: string,
  newPassword: string,
) {
  const ip = await getClientIp();
  const rl = checkRateLimit("resetPassword", ip);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  if (newPassword.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다" };
  }

  const record = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, `reset:${email}`),
      eq(verificationTokens.token, token),
    ),
  });

  if (!record) {
    return { error: "유효하지 않은 링크입니다" };
  }

  if (record.expires < new Date()) {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, `reset:${email}`),
          eq(verificationTokens.token, token),
        ),
      );
    return { error: "링크가 만료되었습니다. 관리자에게 다시 요청해주세요." };
  }

  const hashedPassword = await hash(newPassword, 12);

  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.email, email));

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, `reset:${email}`));

  return { success: true };
}

export async function checkEmailVerified(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { emailVerified: true },
  });

  if (!user) return { status: "not_found" as const };
  if (!user.emailVerified) return { status: "unverified" as const };
  return { status: "verified" as const };
}
