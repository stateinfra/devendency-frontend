"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { comments, posts, users, spamFilters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { commentSchema } from "@/lib/validations/comment";
import { checkRateLimit } from "@/lib/rate-limit";
import { isAdmin } from "@/lib/db/helpers";
import { verifyTurnstile, normalizeForFilter } from "@/lib/turnstile";

export async function createComment(postId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const commentUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { emailVerified: true },
  });
  if (!commentUser?.emailVerified) {
    return { error: "이메일 인증 후 댓글을 작성할 수 있습니다" };
  }

  const turnstileToken = formData.get("turnstileToken") as string | null;
  if (!(await verifyTurnstile(turnstileToken))) {
    return { error: "보안 인증에 실패했습니다. 다시 시도해주세요." };
  }

  const rl = checkRateLimit("createComment", session.user.id);
  if (!rl.success)
    return {
      error: "댓글 작성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    };

  const raw = {
    content: formData.get("content") as string,
    parentId: (formData.get("parentId") as string) || undefined,
  };

  const parsed = commentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  });
  if (!post) return { error: "글을 찾을 수 없습니다" };
  if (!post.published) return { error: "임시저장 글에는 댓글을 작성할 수 없습니다" };

  // 스팸 필터 체크 (NFKC + 공백/제로폭 제거)
  const filters = await db.query.spamFilters.findMany();
  const normalized = normalizeForFilter(parsed.data.content);
  const blocked = filters.find((f) => normalized.includes(normalizeForFilter(f.pattern)));
  if (blocked) {
    return { error: "스팸으로 감지되었습니다" };
  }

  await db.insert(comments).values({
    content: parsed.data.content,
    postId,
    authorId: session.user.id,
    parentId: parsed.data.parentId || null,
  });

  revalidatePath(`/posts/${post.slug}`);
  return { success: true };
}

export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const rl = checkRateLimit("deleteComment", session.user.id);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    with: { post: true },
  });
  if (!comment) return { error: "댓글을 찾을 수 없습니다" };
  if (
    comment.authorId !== session.user.id &&
    !(await isAdmin(session.user.id))
  ) {
    return { error: "권한이 없습니다" };
  }

  await db.delete(comments).where(eq(comments.id, commentId));
  revalidatePath(`/posts/${comment.post.slug}`);
  return { success: true };
}
