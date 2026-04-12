"use server";

import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { profileSchema } from "@/lib/validations/profile";
import { checkRateLimit } from "@/lib/rate-limit";
import { uploadImage } from "@/lib/s3";
import { sendVerificationCode } from "@/lib/resend";
import crypto from "crypto";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5MB

function detectAvatarMime(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";
  return null;
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const rl = checkRateLimit("updateProfile", session.user.id);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const cleanHandle = (h?: string | null) => {
    const t = (h ?? "").trim().replace(/^@/, "");
    return t || undefined;
  };

  const raw = {
    username: (formData.get("username") as string)?.trim(),
    name: (formData.get("name") as string)?.trim(),
    bio: (formData.get("bio") as string)?.trim() || undefined,
    github: cleanHandle(formData.get("github") as string | null),
    linkedin: cleanHandle(formData.get("linkedin") as string | null),
    twitter: cleanHandle(formData.get("twitter") as string | null),
    instagram: cleanHandle(formData.get("instagram") as string | null),
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { username, name, bio, github, linkedin, twitter, instagram } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: { id: true },
  });
  if (existing && existing.id !== session.user.id) {
    return { error: "이미 사용 중인 사용자명입니다" };
  }

  await db
    .update(users)
    .set({
      username,
      name,
      bio: bio || null,
      github: github || null,
      linkedin: linkedin || null,
      twitter: twitter || null,
      instagram: instagram || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return { success: true };
}

export async function updateAvatar(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const rl = checkRateLimit("updateAvatar", session.user.id);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "파일을 선택해주세요" };
  if (file.size > AVATAR_MAX_BYTES) return { error: "파일 크기는 5MB 이하여야 합니다" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = detectAvatarMime(buffer);
  if (!mime) return { error: "JPG, PNG, WebP, GIF 형식만 지원합니다" };

  const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
  const filename = `avatars/${session.user.id}/${crypto.randomUUID()}.${ext}`;

  let url: string;
  try {
    url = await uploadImage(buffer, filename, mime);
  } catch {
    return { error: "이미지 업로드에 실패했습니다" };
  }

  await db
    .update(users)
    .set({ image: url, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return { success: true, image: url };
}

export async function updateEmail(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const rl = checkRateLimit("updateEmail", session.user.id);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const newEmail = (formData.get("email") as string)?.trim().toLowerCase();
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return { error: "올바른 이메일을 입력해주세요" };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, newEmail),
    columns: { id: true },
  });
  if (existing && existing.id !== session.user.id) {
    return { error: "이미 사용 중인 이메일입니다" };
  }

  // 이메일 변경 → emailVerified 초기화
  await db
    .update(users)
    .set({ email: newEmail, emailVerified: null, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  // 인증 코드 발송
  const code = crypto.randomInt(100000, 999999).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, newEmail));

  await db.insert(verificationTokens).values({
    identifier: newEmail,
    token: code,
    expires,
  });

  await sendVerificationCode(newEmail, code);

  return { success: true, email: newEmail };
}

export async function resendEmailVerification() {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const rl = checkRateLimit("resendVerification", session.user.id);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { email: true, emailVerified: true },
  });
  if (!user?.email) return { error: "이메일이 설정되어 있지 않습니다" };
  if (user.emailVerified) return { error: "이미 인증된 이메일입니다" };

  const code = crypto.randomInt(100000, 999999).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, user.email));

  await db.insert(verificationTokens).values({
    identifier: user.email,
    token: code,
    expires,
  });

  await sendVerificationCode(user.email, code);

  return { success: true };
}

export async function verifyEmailFromSettings(code: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const rl = checkRateLimit("verifyEmailSettings", session.user.id);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { email: true },
  });
  if (!user?.email) return { error: "이메일이 설정되어 있지 않습니다" };

  const token = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.identifier, user.email),
  });

  if (!token || token.token !== code) {
    return { error: "인증 코드가 올바르지 않습니다" };
  }
  if (token.expires < new Date()) {
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, user.email));
    return { error: "인증 코드가 만료되었습니다. 재발송해주세요." };
  }

  await db
    .update(users)
    .set({ emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, user.email));

  return { success: true };
}
