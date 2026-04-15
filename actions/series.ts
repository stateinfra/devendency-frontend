"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { series, posts } from "@/lib/db/schema";
import { eq, and, asc, max } from "drizzle-orm";
import { auth } from "@/lib/auth";
import slugify from "slugify";
import crypto from "crypto";

export async function createSeries(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const name = (formData.get("name") as string)?.trim();
  const visibility =
    formData.get("visibility") === "private" ? "private" : "public";

  if (!name || name.length > 100) {
    return { error: "시리즈 이름을 입력해주세요 (최대 100자)" };
  }

  const slug =
    slugify(name, { lower: true, strict: true }) ||
    name.toLowerCase().replace(/\s+/g, "-");
  const finalSlug = `${slug}-${crypto.randomUUID().slice(0, 8)}`;

  const [created] = await db
    .insert(series)
    .values({
      name,
      slug: finalSlug,
      visibility,
      authorId: session.user.id,
    })
    .returning();

  revalidatePath("/");
  return { success: true, series: created };
}

export async function updateSeries(seriesId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const s = await db.query.series.findFirst({
    where: eq(series.id, seriesId),
  });
  if (!s) return { error: "시리즈를 찾을 수 없습니다" };
  if (s.authorId !== session.user.id) return { error: "권한이 없습니다" };

  const name = (formData.get("name") as string)?.trim();

  if (!name || name.length > 100) {
    return { error: "시리즈 이름을 입력해주세요 (최대 100자)" };
  }

  await db
    .update(series)
    .set({ name, updatedAt: new Date() })
    .where(eq(series.id, seriesId));

  revalidatePath("/");
  revalidatePath(`/series/${s.slug}`);
  return { success: true };
}

export async function setSeriesVisibility(
  seriesId: string,
  visibility: "public" | "private",
) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const s = await db.query.series.findFirst({
    where: eq(series.id, seriesId),
  });
  if (!s) return { error: "시리즈를 찾을 수 없습니다" };
  if (s.authorId !== session.user.id) return { error: "권한이 없습니다" };

  await db
    .update(series)
    .set({ visibility, updatedAt: new Date() })
    .where(eq(series.id, seriesId));

  revalidatePath("/");
  revalidatePath(`/series/${s.slug}`);
  return { success: true };
}


export async function deleteSeries(seriesId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const s = await db.query.series.findFirst({
    where: eq(series.id, seriesId),
  });
  if (!s) return { error: "시리즈를 찾을 수 없습니다" };
  if (s.authorId !== session.user.id) return { error: "권한이 없습니다" };

  // 시리즈의 글들에서 시리즈 참조 제거
  await db
    .update(posts)
    .set({ seriesId: null, seriesOrder: null })
    .where(eq(posts.seriesId, seriesId));

  await db.delete(series).where(eq(series.id, seriesId));

  revalidatePath("/");
  return { success: true };
}

export async function addPostToSeries(postId: string, seriesId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const [post, s] = await Promise.all([
    db.query.posts.findFirst({ where: eq(posts.id, postId) }),
    db.query.series.findFirst({ where: eq(series.id, seriesId) }),
  ]);

  if (!post || !s) return { error: "글 또는 시리즈를 찾을 수 없습니다" };
  if (post.authorId !== session.user.id || s.authorId !== session.user.id) {
    return { error: "권한이 없습니다" };
  }

  // 현재 시리즈의 마지막 순서 + 1
  const [result] = await db
    .select({ maxOrder: max(posts.seriesOrder) })
    .from(posts)
    .where(eq(posts.seriesId, seriesId));

  const nextOrder = (result?.maxOrder ?? 0) + 1;

  await db
    .update(posts)
    .set({ seriesId, seriesOrder: nextOrder, updatedAt: new Date() })
    .where(eq(posts.id, postId));

  revalidatePath("/");
  return { success: true };
}

export async function removePostFromSeries(postId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  });
  if (!post) return { error: "글을 찾을 수 없습니다" };
  if (post.authorId !== session.user.id) return { error: "권한이 없습니다" };

  await db
    .update(posts)
    .set({ seriesId: null, seriesOrder: null, updatedAt: new Date() })
    .where(eq(posts.id, postId));

  revalidatePath("/");
  return { success: true };
}

export async function reorderSeriesPosts(
  seriesId: string,
  postIds: string[],
) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const s = await db.query.series.findFirst({
    where: eq(series.id, seriesId),
  });
  if (!s) return { error: "시리즈를 찾을 수 없습니다" };
  if (s.authorId !== session.user.id) return { error: "권한이 없습니다" };

  await db.transaction(async (tx) => {
    for (let i = 0; i < postIds.length; i++) {
      await tx
        .update(posts)
        .set({ seriesOrder: i + 1 })
        .where(and(eq(posts.id, postIds[i]), eq(posts.seriesId, seriesId)));
    }
  });

  revalidatePath("/");
  return { success: true };
}

export async function getUserSeries() {
  const session = await auth();
  if (!session?.user) return [];

  return db.query.series.findMany({
    where: eq(series.authorId, session.user.id),
    orderBy: asc(series.createdAt),
  });
}
