"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { domainSchema } from "@/lib/validations/domain";
import { uploadImage } from "@/lib/s3";
import crypto from "crypto";
import {
  addDomainToProject,
  removeDomainFromProject,
  verifyProjectDomain,
  getDomainConfig,
} from "@/lib/vercel";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다", session: null };
  if (session.user.role !== "SUPER_ADMIN")
    return { error: "권한이 없습니다", session: null };
  return { error: null, session };
}

export async function registerCustomDomain(formData: FormData) {
  const { error, session } = await requireSuperAdmin();
  if (error || !session) return { error: error! };

  const raw = (formData.get("domain") as string)?.trim();
  const parsed = domainSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const domain = parsed.data;

  // 이미 다른 유저가 사용 중인지 확인
  const existing = await db.query.users.findFirst({
    where: eq(users.customDomain, domain),
    columns: { id: true },
  });
  if (existing && existing.id !== session.user.id) {
    return { error: "이미 다른 사용자가 사용 중인 도메인입니다" };
  }

  // Vercel 프로젝트에 도메인 추가
  try {
    await addDomainToProject(domain);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "도메인 추가에 실패했습니다";
    return { error: msg };
  }

  // DB에 저장
  await db
    .update(users)
    .set({ customDomain: domain, domainVerified: false, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return { success: true };
}

export async function verifyCustomDomain() {
  const { error, session } = await requireSuperAdmin();
  if (error || !session) return { error: error! };

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { customDomain: true },
  });

  if (!user?.customDomain) {
    return { error: "등록된 도메인이 없습니다" };
  }

  try {
    const [verifyResult, configResult] = await Promise.all([
      verifyProjectDomain(user.customDomain),
      getDomainConfig(user.customDomain),
    ]);

    const verified = verifyResult.verified === true && !configResult.misconfigured;

    await db
      .update(users)
      .set({ domainVerified: verified, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    if (!verified) {
      return { error: "DNS 설정이 아직 반영되지 않았습니다. 잠시 후 다시 시도해주세요." };
    }

    return { success: true };
  } catch {
    return { error: "도메인 인증에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }
}

export async function removeCustomDomain() {
  const { error, session } = await requireSuperAdmin();
  if (error || !session) return { error: error! };

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { customDomain: true },
  });

  if (!user?.customDomain) {
    return { error: "등록된 도메인이 없습니다" };
  }

  try {
    await removeDomainFromProject(user.customDomain);
  } catch {
    // Vercel에서 이미 제거된 경우에도 DB는 정리
  }

  await db
    .update(users)
    .set({ customDomain: null, domainVerified: false, customLogo: null, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return { success: true };
}

const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function updateCustomLogo(formData: FormData) {
  const { error, session } = await requireSuperAdmin();
  if (error || !session) return { error: error! };

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return { error: "파일을 선택해주세요" };
  if (file.size > LOGO_MAX_BYTES) return { error: "파일 크기는 2MB 이하여야 합니다" };
  if (!ALLOWED_LOGO_TYPES.includes(file.type))
    return { error: "PNG, JPG, WebP, SVG 형식만 지원합니다" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  const filename = `logos/${session.user.id}/${crypto.randomUUID()}.${ext}`;

  let url: string;
  try {
    url = await uploadImage(buffer, filename, file.type);
  } catch {
    return { error: "이미지 업로드에 실패했습니다" };
  }

  await db
    .update(users)
    .set({ customLogo: url, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return { success: true, logo: url };
}
