"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { posts, tags, postTags, likes } from "@/lib/db/schema";
import { eq, and, asc, lt, count as drizzleCount } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { postSchema } from "@/lib/validations/post";
import { isAdmin } from "@/lib/db/helpers";
import slugify from "slugify";
import { generateExcerpt } from "@/lib/utils";
import { uploadImage } from "@/lib/s3";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";

const OWN_HOST = (process.env.S3_ENDPOINT || "").replace("/s3", "");
const MAX_DOWNLOAD = 5 * 1024 * 1024; // 5MB

function detectMime(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "image/jpeg";
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
    return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46)
    return "image/gif";
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return "image/webp";
  return null;
}

async function uploadToS3(
  buffer: Buffer,
  userId: string,
): Promise<string | null> {
  const mime = detectMime(buffer);
  if (!mime) return null;
  const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
  const filename = `images/${userId}/${crypto.randomUUID()}.${ext}`;
  return uploadImage(buffer, filename, mime);
}

async function processContentImages(
  content: string,
  userId: string,
): Promise<string> {
  let result = content;

  // 1) base64 이미지 → S3
  const base64Regex =
    /!\[([^\]]*)\]\((data:image\/[\w+]+;base64,[A-Za-z0-9+/=\s]+)\)/g;
  for (const match of [...content.matchAll(base64Regex)]) {
    const [fullMatch, alt, dataUrl] = match;
    try {
      const base64 = dataUrl.split(",")[1].replace(/\s/g, "");
      const buffer = Buffer.from(base64, "base64");
      if (buffer.length > MAX_DOWNLOAD) continue;
      const url = await uploadToS3(buffer, userId);
      if (url) result = result.replace(fullMatch, `![${alt}](${url})`);
    } catch {
      /* 원본 유지 */
    }
  }

  // 2) 외부 URL 이미지 → 다운로드 후 검증 → S3
  const urlRegex = /!\[([^\]]*)\]\((https?:\/\/\S+?)\)/g;
  for (const match of [...result.matchAll(urlRegex)]) {
    const [fullMatch, alt, imgUrl] = match;
    if (OWN_HOST && imgUrl.startsWith(OWN_HOST)) continue;
    // SSRF 방지: private IP 차단
    try {
      const hostname = new URL(imgUrl).hostname;
      if (
        /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.|169\.254\.|localhost|::1|\[::)/.test(
          hostname,
        )
      )
        continue;
    } catch {
      continue;
    }
    try {
      const res = await fetch(imgUrl, {
        signal: AbortSignal.timeout(10000),
        redirect: "error",
      });
      if (!res.ok) continue;
      const contentLength = Number(res.headers.get("content-length") || 0);
      if (contentLength > MAX_DOWNLOAD) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > MAX_DOWNLOAD) continue;
      const url = await uploadToS3(buffer, userId);
      if (url) result = result.replace(fullMatch, `![${alt}](${url})`);
    } catch {
      /* 다운로드 실패 시 원본 유지 */
    }
  }

  return result;
}

async function findOrCreateTags(tagNames: string[]) {
  return Promise.all(
    tagNames.map(async (name) => {
      const trimmed = name.trim();
      let slug =
        slugify(trimmed, { lower: true, strict: true }) ||
        trimmed.toLowerCase();

      try {
        const [tag] = await db
          .insert(tags)
          .values({ name: trimmed, slug })
          .onConflictDoUpdate({
            target: tags.name,
            set: { name: trimmed },
          })
          .returning();
        return { tagId: tag.id };
      } catch {
        // slug collision — append suffix
        slug = `${slug}-${crypto.randomUUID()}`;
        const [tag] = await db
          .insert(tags)
          .values({ name: trimmed, slug })
          .onConflictDoUpdate({
            target: tags.name,
            set: { name: trimmed },
          })
          .returning();
        return { tagId: tag.id };
      }
    }),
  );
}

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "로그인이 필요합니다" };
  }

  const rl = checkRateLimit("createPost", session.user.id);
  if (!rl.success)
    return {
      error: "글 작성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    };

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

  const {
    title,
    content: rawContent,
    excerpt,
    tagNames: parsedTagNames,
    published,
  } = parsed.data;
  const content = await processContentImages(rawContent, session.user.id);
  const coverImage = (formData.get("coverImage") as string) || null;

  const finalSlug = crypto.randomUUID();

  const tagConnections = parsedTagNames?.length
    ? await findOrCreateTags(parsedTagNames)
    : [];

  const MAX_DRAFTS = 3;

  const post = await db.transaction(async (tx) => {
    // 임시저장 시 초과 초안 자동 삭제 (가장 오래된 것부터)
    if (!published) {
      const [{ draftCount }] = await tx
        .select({ draftCount: drizzleCount() })
        .from(posts)
        .where(and(eq(posts.authorId, session.user.id), eq(posts.published, false)));

      if (draftCount >= MAX_DRAFTS) {
        const oldest = await tx
          .select({ id: posts.id })
          .from(posts)
          .where(and(eq(posts.authorId, session.user.id), eq(posts.published, false)))
          .orderBy(asc(posts.createdAt))
          .limit(draftCount - MAX_DRAFTS + 1);

        if (oldest.length > 0) {
          for (const { id } of oldest) {
            await tx.delete(posts).where(eq(posts.id, id));
          }
        }
      }
    }

    const seriesId = (formData.get("seriesId") as string) || null;

    const [newPost] = await tx
      .insert(posts)
      .values({
        title,
        slug: finalSlug,
        content,
        excerpt: excerpt || generateExcerpt(content),
        coverImage,
        published,
        publishedAt: published ? new Date() : null,
        authorId: session.user.id,
        seriesId,
      })
      .returning();

    if (tagConnections.length) {
      await tx.insert(postTags).values(
        tagConnections.map((tc) => ({
          postId: newPost.id,
          tagId: tc.tagId,
        })),
      );
    }

    return newPost;
  });

  revalidatePath("/");
  return { success: true, slug: post.slug };
}

export async function updatePost(postId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const rl = checkRateLimit("updatePost", session.user.id);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  });
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

  const {
    title,
    content: rawContent,
    excerpt,
    tagNames: parsedTagNames,
    published,
  } = parsed.data;
  const content = await processContentImages(rawContent, session.user.id);
  const coverImageRaw = formData.get("coverImage") as string;
  // 빈 문자열이면 제거, URL이면 유지, 필드 없으면 기존 값 유지
  const coverImage =
    coverImageRaw === "" ? null : coverImageRaw || post.coverImage;

  const tagConnections = parsedTagNames?.length
    ? await findOrCreateTags(parsedTagNames)
    : [];

  const wasPublished = post.published;

  const seriesId = (formData.get("seriesId") as string) || null;

  await db.transaction(async (tx) => {
    await tx.delete(postTags).where(eq(postTags.postId, postId));

    await tx
      .update(posts)
      .set({
        title,
        content,
        excerpt: excerpt || generateExcerpt(content),
        coverImage,
        published,
        publishedAt:
          published && !wasPublished ? new Date() : post.publishedAt,
        seriesId,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    if (tagConnections.length) {
      await tx.insert(postTags).values(
        tagConnections.map((tc) => ({
          postId,
          tagId: tc.tagId,
        })),
      );
    }
  });

  revalidatePath("/");
  revalidatePath(`/posts/${post.slug}`);
  return { success: true };
}

export async function deletePost(postId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const rl = checkRateLimit("deletePost", session.user.id);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  });
  if (!post) return { error: "글을 찾을 수 없습니다" };
  if (post.authorId !== session.user.id && !(await isAdmin(session.user.id))) {
    return { error: "권한이 없습니다" };
  }

  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath("/");
  return { success: true };
}

export async function toggleLike(postId: string) {
  const session = await auth();
  if (!session?.user) return { error: "로그인이 필요합니다" };

  const rl = checkRateLimit("toggleLike", session.user.id);
  if (!rl.success)
    return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };

  const existing = await db.query.likes.findFirst({
    where: and(
      eq(likes.userId, session.user.id),
      eq(likes.postId, postId),
    ),
  });

  if (existing) {
    await db
      .delete(likes)
      .where(
        and(eq(likes.userId, session.user.id), eq(likes.postId, postId)),
      );
  } else {
    await db.insert(likes).values({
      userId: session.user.id,
      postId,
    });
  }

  revalidatePath("/");
  return { success: true, liked: !existing };
}
