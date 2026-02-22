"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { postSchema } from "@/lib/validations/post";
import slugify from "slugify";
import { generateExcerpt } from "@/lib/utils";
import { uploadImage } from "@/lib/s3";
import crypto from "crypto";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return !!user && ADMIN_ROLES.includes(user.role);
}

const OWN_HOST = (process.env.S3_ENDPOINT || "").replace("/s3", "");
const MAX_DOWNLOAD = 5 * 1024 * 1024; // 5MB

function detectMime(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  return null;
}

async function uploadToS3(buffer: Buffer, userId: string): Promise<string | null> {
  const mime = detectMime(buffer);
  if (!mime) return null;
  const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
  const filename = `images/${userId}/${crypto.randomUUID()}.${ext}`;
  return uploadImage(buffer, filename, mime);
}

async function processContentImages(content: string, userId: string): Promise<string> {
  let result = content;

  // 1) base64 이미지 → S3
  const base64Regex = /!\[([^\]]*)\]\((data:image\/[\w+]+;base64,[A-Za-z0-9+/=\s]+)\)/g;
  for (const match of [...content.matchAll(base64Regex)]) {
    const [fullMatch, alt, dataUrl] = match;
    try {
      const base64 = dataUrl.split(",")[1].replace(/\s/g, "");
      const buffer = Buffer.from(base64, "base64");
      if (buffer.length > MAX_DOWNLOAD) continue;
      const url = await uploadToS3(buffer, userId);
      if (url) result = result.replace(fullMatch, `![${alt}](${url})`);
    } catch { /* 원본 유지 */ }
  }

  // 2) 외부 URL 이미지 → 다운로드 후 검증 → S3
  const urlRegex = /!\[([^\]]*)\]\((https?:\/\/\S+?)\)/g;
  for (const match of [...result.matchAll(urlRegex)]) {
    const [fullMatch, alt, imgUrl] = match;
    if (OWN_HOST && imgUrl.startsWith(OWN_HOST)) continue;
    // SSRF 방지: private IP 차단
    try {
      const hostname = new URL(imgUrl).hostname;
      if (/^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.|169\.254\.|localhost|::1|\[::)/.test(hostname)) continue;
    } catch { continue; }
    try {
      const res = await fetch(imgUrl, { signal: AbortSignal.timeout(10000), redirect: "error" });
      if (!res.ok) continue;
      const contentLength = Number(res.headers.get("content-length") || 0);
      if (contentLength > MAX_DOWNLOAD) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > MAX_DOWNLOAD) continue;
      const url = await uploadToS3(buffer, userId);
      if (url) result = result.replace(fullMatch, `![${alt}](${url})`);
    } catch { /* 다운로드 실패 시 원본 유지 */ }
  }

  return result;
}

async function findOrCreateTags(tagNames: string[]) {
  return Promise.all(
    tagNames.map(async (name) => {
      const trimmed = name.trim();
      let slug = slugify(trimmed, { lower: true, strict: true }) || trimmed.toLowerCase();
      const tag = await prisma.tag.upsert({
        where: { name: trimmed },
        create: { name: trimmed, slug },
        update: {},
      }).catch(async () => {
        // slug collision — append suffix
        slug = `${slug}-${crypto.randomUUID()}`;
        return prisma.tag.upsert({
          where: { name: trimmed },
          create: { name: trimmed, slug },
          update: {},
        });
      });
      return { tagId: tag.id };
    })
  );
}

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "로그인이 필요합니다" };
  }

  const raw = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    excerpt: (formData.get("excerpt") as string) || undefined,
    tagNames: formData.getAll("tagNames") as string[],
    published: formData.get("published") === "true",
  };

  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, content: rawContent, excerpt, tagNames, published } = parsed.data;
  const content = await processContentImages(rawContent, session.user.id);

  const finalSlug = crypto.randomUUID();

  const tagConnections = tagNames?.length
    ? await findOrCreateTags(tagNames)
    : [];

  const post = await prisma.post.create({
    data: {
      title,
      slug: finalSlug,
      content,
      excerpt: excerpt || generateExcerpt(content),
      published,
      publishedAt: published ? new Date() : null,
      authorId: session.user.id,
      tags: tagConnections.length
        ? { create: tagConnections }
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
  if (post.authorId !== session.user.id && !(await isAdmin(session.user.id))) {
    return { error: "권한이 없습니다" };
  }

  const raw = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    excerpt: (formData.get("excerpt") as string) || undefined,
    tagNames: formData.getAll("tagNames") as string[],
    published: formData.get("published") === "true",
  };

  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, content: rawContent, excerpt, tagNames, published } = parsed.data;
  const content = await processContentImages(rawContent, session.user.id);

  await prisma.postTag.deleteMany({ where: { postId } });

  const tagConnections = tagNames?.length
    ? await findOrCreateTags(tagNames)
    : [];

  const wasPublished = post.published;

  await prisma.post.update({
    where: { id: postId },
    data: {
      title,
      content,
      excerpt: excerpt || generateExcerpt(content),
      published,
      publishedAt:
        published && !wasPublished ? new Date() : post.publishedAt,
      tags: tagConnections.length
        ? { create: tagConnections }
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
  if (post.authorId !== session.user.id && !(await isAdmin(session.user.id))) {
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
