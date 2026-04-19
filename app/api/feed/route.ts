import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, tags, postTags, follows } from "@/lib/db/schema";
import { publicPostWhere } from "@/lib/db/post-visibility";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { POSTS_PER_PAGE } from "@/lib/constants";
import { auth } from "@/lib/auth";
import type { PostWithRelations } from "@/types";

const postQueryWith = {
  author: { columns: { id: true, username: true, name: true, image: true, role: true } },
  tags: { with: { tag: true } },
  comments: { columns: { id: true } },
  likes: { columns: { userId: true } },
} as const;

function toPostWithCounts(results: any[]): PostWithRelations[] {
  return results.map((p) => ({
    ...p,
    _count: { comments: p.comments.length, likes: p.likes.length },
  })) as unknown as PostWithRelations[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "latest";
  const tagSlug = searchParams.get("tag");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const offset = (page - 1) * POSTS_PER_PAGE;

  if (tagSlug) {
    const decodedSlug = decodeURIComponent(tagSlug);
    const tag = await db.query.tags.findFirst({ where: eq(tags.slug, decodedSlug) });
    if (!tag) return NextResponse.json({ posts: [], hasMore: false });

    const taggedPostIds = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .where(eq(postTags.tagId, tag.id));
    const ids = taggedPostIds.map((r) => r.postId);
    if (ids.length === 0) return NextResponse.json({ posts: [], hasMore: false });

    const whereCondition = and(publicPostWhere, inArray(posts.id, ids));
    const result = await db.query.posts.findMany({
      where: whereCondition,
      orderBy: desc(posts.publishedAt),
      limit: POSTS_PER_PAGE,
      offset,
      with: postQueryWith,
    });
    const items = toPostWithCounts(result);
    return NextResponse.json({ posts: items, hasMore: items.length === POSTS_PER_PAGE });
  }

  if (tab === "popular") {
    const likeCountExpr = sql<number>`(SELECT count(*) FROM "Like" WHERE "Like"."postId" = ${posts.id})`;
    const popularIds = await db
      .select({ postId: posts.id })
      .from(posts)
      .where(and(publicPostWhere, eq(posts.isAnnouncement, false)))
      .orderBy(desc(likeCountExpr))
      .limit(POSTS_PER_PAGE)
      .offset(offset);
    const ids = popularIds.map((r) => r.postId);
    if (ids.length === 0) return NextResponse.json({ posts: [], hasMore: false });

    const fetched = await db.query.posts.findMany({
      where: inArray(posts.id, ids),
      with: postQueryWith,
    });
    const orderMap = new Map(ids.map((id, i) => [id, i]));
    const sorted = fetched.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    const items = toPostWithCounts(sorted);
    return NextResponse.json({ posts: items, hasMore: items.length === POSTS_PER_PAGE });
  }

  if (tab === "following") {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ posts: [], hasMore: false });

    const following = await db.query.follows.findMany({
      where: eq(follows.followerId, session.user.id),
      columns: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    if (followingIds.length === 0) return NextResponse.json({ posts: [], hasMore: false });

    const whereCondition = and(
      publicPostWhere,
      eq(posts.isAnnouncement, false),
      inArray(posts.authorId, followingIds),
    );
    const result = await db.query.posts.findMany({
      where: whereCondition,
      orderBy: desc(posts.publishedAt),
      limit: POSTS_PER_PAGE,
      offset,
      with: postQueryWith,
    });
    const items = toPostWithCounts(result);
    return NextResponse.json({ posts: items, hasMore: items.length === POSTS_PER_PAGE });
  }

  // latest (default)
  const whereCondition = and(publicPostWhere, eq(posts.isAnnouncement, false));
  const result = await db.query.posts.findMany({
    where: whereCondition,
    orderBy: desc(posts.publishedAt),
    limit: POSTS_PER_PAGE,
    offset,
    with: postQueryWith,
  });
  const items = toPostWithCounts(result);
  return NextResponse.json({ posts: items, hasMore: items.length === POSTS_PER_PAGE });
}
