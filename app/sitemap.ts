import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { posts, tags, users } from "@/lib/db/schema";
import { publicPostWhere } from "@/lib/db/post-visibility";
import { eq } from "drizzle-orm";
import { SITE_CONFIG } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_CONFIG.url;
  const now = new Date();

  // 정적 페이지
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/tags`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  // 발행된 글
  const publishedPosts = await db
    .select({ slug: posts.slug, updatedAt: posts.updatedAt })
    .from(posts)
    .where(publicPostWhere);

  const postRoutes: MetadataRoute.Sitemap = publishedPosts.map((post) => ({
    url: `${base}/posts/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 태그 페이지
  const allTags = await db.select({ slug: tags.slug }).from(tags);

  const tagRoutes: MetadataRoute.Sitemap = allTags.map((tag) => ({
    url: `${base}/tags/${encodeURIComponent(tag.slug)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  // 유저 프로필 페이지
  const allUsers = await db
    .select({ username: users.username, updatedAt: users.updatedAt })
    .from(users)
    .where(eq(users.suspended, false));

  const userRoutes: MetadataRoute.Sitemap = allUsers
    .filter((u) => u.username)
    .map((u) => ({
      url: `${base}/users/@${u.username}`,
      lastModified: u.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...postRoutes, ...tagRoutes, ...userRoutes];
}
