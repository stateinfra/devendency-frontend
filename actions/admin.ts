"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users, posts, verificationTokens } from "@/lib/db/schema";
import { eq, ilike, or, desc, count, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireAdmin as requireAdminHelper } from "@/lib/db/helpers";
import { sendPasswordResetEmail } from "@/lib/resend";
import crypto from "crypto";

const ADMIN_PAGE_SIZE = 20;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("권한이 없습니다");
  await requireAdminHelper(session.user.id);
  return session;
}

export async function getUsers(page: number = 1, search: string = "") {
  await requireAdmin();

  const whereClause = search
    ? or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.username, `%${search}%`),
      )
    : undefined;

  const [userList, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        role: users.role,
        suspended: users.suspended,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        _count: {
          posts: sql<number>`(SELECT count(*) FROM "Post" WHERE "Post"."authorId" = "User"."id")::int`,
          comments: sql<number>`(SELECT count(*) FROM "Comment" WHERE "Comment"."authorId" = "User"."id")::int`,
        },
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((page - 1) * ADMIN_PAGE_SIZE),
    db
      .select({ total: count() })
      .from(users)
      .where(whereClause),
  ]);

  return {
    users: userList,
    total,
    totalPages: Math.ceil(total / ADMIN_PAGE_SIZE),
  };
}

export async function suspendUser(userId: string) {
  const session = await requireAdmin();

  if (userId === session.user.id) {
    return { error: "자기 자신을 정지할 수 없습니다" };
  }

  await db
    .update(users)
    .set({ suspended: true, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function unsuspendUser(userId: string) {
  await requireAdmin();

  await db
    .update(users)
    .set({ suspended: false, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const session = await requireAdmin();

  if (userId === session.user.id) {
    return { error: "자기 자신을 삭제할 수 없습니다" };
  }

  await db.delete(users).where(eq(users.id, userId));

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function adminSendPasswordReset(userId: string) {
  await requireAdmin();

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { email: true },
  });

  if (!user?.email) {
    return { error: "이메일이 없는 유저입니다" };
  }

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, `reset:${user.email}`));

  await db.insert(verificationTokens).values({
    identifier: `reset:${user.email}`,
    token,
    expires,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

  await sendPasswordResetEmail(user.email, resetUrl);

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function getPosts(page: number = 1, search: string = "") {
  await requireAdmin();

  const whereClause = search
    ? or(
        ilike(posts.title, `%${search}%`),
        sql`EXISTS (SELECT 1 FROM "User" WHERE "User"."id" = "Post"."authorId" AND (
          "User"."name" ILIKE ${`%${search}%`} OR "User"."username" ILIKE ${`%${search}%`}
        ))`,
      )
    : undefined;

  const [postList, [{ total }]] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        published: posts.published,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        author: {
          name: sql<string | null>`(SELECT "User"."name" FROM "User" WHERE "User"."id" = "Post"."authorId")`,
          username: sql<string | null>`(SELECT "User"."username" FROM "User" WHERE "User"."id" = "Post"."authorId")`,
        },
        _count: {
          comments: sql<number>`(SELECT count(*) FROM "Comment" WHERE "Comment"."postId" = "Post"."id")::int`,
          likes: sql<number>`(SELECT count(*) FROM "Like" WHERE "Like"."postId" = "Post"."id")::int`,
        },
      })
      .from(posts)
      .where(whereClause)
      .orderBy(desc(posts.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((page - 1) * ADMIN_PAGE_SIZE),
    db
      .select({ total: count() })
      .from(posts)
      .where(whereClause),
  ]);

  return {
    posts: postList,
    total,
    totalPages: Math.ceil(total / ADMIN_PAGE_SIZE),
  };
}

export async function changeUserRole(
  userId: string,
  role: "WRITER" | "ADMIN",
) {
  const session = await requireAdmin();

  if (userId === session.user.id) {
    return { error: "자기 자신의 역할은 변경할 수 없습니다" };
  }

  await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function toggleAnnouncement(postId: string) {
  await requireAdmin();

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: { isAnnouncement: true },
  });
  if (!post) return { error: "글을 찾을 수 없습니다" };

  if (post.isAnnouncement) {
    // 공지 해제
    await db.update(posts).set({ isAnnouncement: false }).where(eq(posts.id, postId));
  } else {
    // 기존 공지 해제 후 새 공지 등록
    await db.update(posts).set({ isAnnouncement: false }).where(eq(posts.isAnnouncement, true));
    await db.update(posts).set({ isAnnouncement: true }).where(eq(posts.id, postId));
  }

  revalidatePath("/");
  revalidatePath("/dashboard/admin");
  return { success: true, isAnnouncement: !post.isAnnouncement };
}

export async function adminDeletePost(postId: string) {
  await requireAdmin();

  await db.delete(posts).where(eq(posts.id, postId));

  revalidatePath("/dashboard/admin");
  revalidatePath("/");
  return { success: true };
}
