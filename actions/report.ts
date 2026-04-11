"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reports, spamFilters, posts, comments } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/db/helpers";

export async function createReport(
  type: "POST" | "COMMENT",
  targetId: string,
  reason: string,
) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const rl = checkRateLimit("report", session.user.id);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  if (!reason.trim()) return { error: "신고 사유를 입력해주세요" };

  // 중복 신고 방지
  const existing = await db.query.reports.findFirst({
    where: and(
      eq(reports.type, type),
      eq(reports.targetId, targetId),
      eq(reports.reporterId, session.user.id),
      eq(reports.status, "PENDING"),
    ),
  });
  if (existing) return { error: "이미 신고한 항목입니다" };

  await db.insert(reports).values({
    type,
    targetId,
    reason: reason.trim(),
    reporterId: session.user.id,
  });

  return { success: true };
}

export async function getReports(page: number = 1) {
  await requireAdmin(
    (await auth())?.user?.id ?? "",
  );

  const PAGE_SIZE = 20;

  const [reportList, [{ total }]] = await Promise.all([
    db.query.reports.findMany({
      where: eq(reports.status, "PENDING"),
      orderBy: desc(reports.createdAt),
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      with: { reporter: { columns: { name: true, username: true } } },
    }),
    db.select({ total: count() }).from(reports).where(eq(reports.status, "PENDING")),
  ]);

  // targetId로 실제 콘텐츠 가져오기
  const enriched = await Promise.all(
    reportList.map(async (r) => {
      let targetContent = "";
      let targetTitle = "";
      if (r.type === "POST") {
        const post = await db.query.posts.findFirst({
          where: eq(posts.id, r.targetId),
          columns: { title: true, slug: true },
        });
        targetTitle = post?.title || "(삭제된 글)";
        targetContent = post?.slug || "";
      } else {
        const comment = await db.query.comments.findFirst({
          where: eq(comments.id, r.targetId),
          columns: { content: true },
        });
        targetContent = comment?.content?.slice(0, 100) || "(삭제된 댓글)";
      }
      return { ...r, targetTitle, targetContent };
    }),
  );

  return { reports: enriched, total, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function resolveReport(reportId: string, action: "dismiss" | "addFilter") {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };
  await requireAdmin(session.user.id);

  const report = await db.query.reports.findFirst({
    where: eq(reports.id, reportId),
  });
  if (!report) return { error: "신고를 찾을 수 없습니다" };

  if (action === "addFilter") {
    // 신고된 콘텐츠에서 패턴 추출하여 스팸 필터에 추가
    let content = "";
    if (report.type === "COMMENT") {
      const comment = await db.query.comments.findFirst({
        where: eq(comments.id, report.targetId),
        columns: { content: true },
      });
      content = comment?.content || "";
    } else {
      const post = await db.query.posts.findFirst({
        where: eq(posts.id, report.targetId),
        columns: { title: true },
      });
      content = post?.title || "";
    }

    if (content) {
      // 신고 사유를 패턴으로 추가
      await db.insert(spamFilters).values({ pattern: report.reason });
    }

    // 해당 콘텐츠 삭제
    if (report.type === "COMMENT") {
      await db.delete(comments).where(eq(comments.id, report.targetId));
    } else {
      await db.delete(posts).where(eq(posts.id, report.targetId));
    }
  }

  await db.update(reports).set({
    status: action === "dismiss" ? "DISMISSED" : "RESOLVED",
  }).where(eq(reports.id, reportId));

  revalidatePath("/dashboard/admin");
  revalidatePath("/");
  return { success: true };
}

export async function getSpamFilters() {
  await requireAdmin(
    (await auth())?.user?.id ?? "",
  );
  return db.query.spamFilters.findMany({ orderBy: desc(spamFilters.createdAt) });
}

export async function addSpamFilter(pattern: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };
  await requireAdmin(session.user.id);

  if (!pattern.trim()) return { error: "패턴을 입력해주세요" };

  await db.insert(spamFilters).values({ pattern: pattern.trim() });
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function deleteSpamFilter(filterId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };
  await requireAdmin(session.user.id);

  await db.delete(spamFilters).where(eq(spamFilters.id, filterId));
  revalidatePath("/dashboard/admin");
  return { success: true };
}
