"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/resend";
import crypto from "crypto";

const ADMIN_PAGE_SIZE = 20;
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("권한이 없습니다");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!dbUser || !ADMIN_ROLES.includes(dbUser.role)) {
    throw new Error("권한이 없습니다");
  }
  return session;
}

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("권한이 없습니다");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
    throw new Error("권한이 없습니다");
  }
  return session;
}

export async function getUsers(page: number = 1, search: string = "") {
  await requireAdmin();

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { username: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        suspended: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { posts: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, totalPages: Math.ceil(total / ADMIN_PAGE_SIZE) };
}

export async function suspendUser(userId: string) {
  const session = await requireAdmin();

  if (userId === session.user.id) {
    return { error: "자기 자신을 정지할 수 없습니다" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { suspended: true },
  });

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function unsuspendUser(userId: string) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { suspended: false },
  });

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const session = await requireAdmin();

  if (userId === session.user.id) {
    return { error: "자기 자신을 삭제할 수 없습니다" };
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function adminSendPasswordReset(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) {
    return { error: "이메일이 없는 유저입니다" };
  }

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verificationToken.deleteMany({
    where: { identifier: `reset:${user.email}` },
  });

  await prisma.verificationToken.create({
    data: { identifier: `reset:${user.email}`, token, expires },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

  await sendPasswordResetEmail(user.email, resetUrl);

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function getPosts(page: number = 1, search: string = "") {
  await requireAdmin();

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { author: { name: { contains: search, mode: "insensitive" as const } } },
          { author: { username: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        author: { select: { name: true, username: true } },
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total, totalPages: Math.ceil(total / ADMIN_PAGE_SIZE) };
}

export async function changeUserRole(
  userId: string,
  role: "READER" | "WRITER" | "ADMIN"
) {
  const session = await requireSuperAdmin();

  if (userId === session.user.id) {
    return { error: "자기 자신의 역할은 변경할 수 없습니다" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function adminDeletePost(postId: string) {
  await requireAdmin();

  await prisma.post.delete({ where: { id: postId } });

  revalidatePath("/dashboard/admin");
  revalidatePath("/");
  return { success: true };
}
