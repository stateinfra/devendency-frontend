"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { domainSchema } from "@/lib/validations/domain";
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
    .set({ customDomain: null, domainVerified: false, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return { success: true };
}
