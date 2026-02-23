"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { profileSchema } from "@/lib/validations/profile";
import { checkRateLimit } from "@/lib/rate-limit";
import { uploadImage } from "@/lib/s3";
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
