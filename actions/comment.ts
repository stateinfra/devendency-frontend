"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { commentSchema } from "@/lib/validations/comment";
import { checkRateLimit } from "@/lib/rate-limit";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return !!user && ADMIN_ROLES.includes(user.role);
}

export async function createComment(postId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const rl = checkRateLimit("createComment", session.user.id);
  if (!rl.success) return { error: "댓글 작성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const raw = {
    content: formData.get("content") as string,
    parentId: (formData.get("parentId") as string) || undefined,
  };

  const parsed = commentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { error: "글을 찾을 수 없습니다" };

  await prisma.comment.create({
    data: {
      content: parsed.data.content,
      postId,
      authorId: session.user.id,
      parentId: parsed.data.parentId || null,
    },
  });

  revalidatePath(`/posts/${post.slug}`);
  return { success: true };
}

export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const rl = checkRateLimit("deleteComment", session.user.id);
  if (!rl.success) return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: true },
  });
  if (!comment) return { error: "댓글을 찾을 수 없습니다" };
  if (comment.authorId !== session.user.id && !(await isAdmin(session.user.id))) {
    return { error: "권한이 없습니다" };
  }

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/posts/${comment.post.slug}`);
  return { success: true };
}
