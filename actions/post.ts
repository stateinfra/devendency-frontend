"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { postSchema } from "@/lib/validations/post";
import slugify from "slugify";
import { generateExcerpt } from "@/lib/utils";

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user || !["WRITER", "ADMIN"].includes(session.user.role)) {
    return { error: "권한이 없습니다" };
  }

  const raw = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    excerpt: (formData.get("excerpt") as string) || undefined,
    categoryId: (formData.get("categoryId") as string) || undefined,
    tagIds: formData.getAll("tagIds") as string[],
    published: formData.get("published") === "true",
  };

  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, content, excerpt, categoryId, tagIds, published } =
    parsed.data;

  const slug = slugify(title, { lower: true, strict: true });

  const existingSlug = await prisma.post.findUnique({ where: { slug } });
  const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

  const post = await prisma.post.create({
    data: {
      title,
      slug: finalSlug,
      content,
      excerpt: excerpt || generateExcerpt(content),
      categoryId: categoryId || null,
      published,
      publishedAt: published ? new Date() : null,
      authorId: session.user.id,
      tags: tagIds?.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  });

  revalidatePath("/");
  return { success: true, slug: post.slug };
}

export async function updatePost(postId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { error: "글을 찾을 수 없습니다" };
  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return { error: "권한이 없습니다" };
  }

  const raw = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    excerpt: (formData.get("excerpt") as string) || undefined,
    categoryId: (formData.get("categoryId") as string) || undefined,
    tagIds: formData.getAll("tagIds") as string[],
    published: formData.get("published") === "true",
  };

  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, content, excerpt, categoryId, tagIds, published } =
    parsed.data;

  await prisma.postTag.deleteMany({ where: { postId } });

  const wasPublished = post.published;

  await prisma.post.update({
    where: { id: postId },
    data: {
      title,
      content,
      excerpt: excerpt || generateExcerpt(content),
      categoryId: categoryId || null,
      published,
      publishedAt:
        published && !wasPublished ? new Date() : post.publishedAt,
      tags: tagIds?.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  });

  revalidatePath("/");
  revalidatePath(`/posts/${post.slug}`);
  return { success: true };
}

export async function deletePost(postId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { error: "글을 찾을 수 없습니다" };
  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return { error: "권한이 없습니다" };
  }

  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/");
  return { success: true };
}

export async function toggleLike(postId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: session.user.id, postId } },
  });

  if (existing) {
    await prisma.like.delete({
      where: { userId_postId: { userId: session.user.id, postId } },
    });
  } else {
    await prisma.like.create({
      data: { userId: session.user.id, postId },
    });
  }

  revalidatePath("/");
  return { success: true, liked: !existing };
}
