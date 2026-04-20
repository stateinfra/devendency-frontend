import { db } from "@/lib/db";
import { posts, follows } from "@/lib/db/schema";
import { publicPostWhere } from "@/lib/db/post-visibility";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { PostList } from "@/components/post/post-list";
import { FeedTabs } from "@/components/post/feed-tabs";
import { POSTS_PER_PAGE } from "@/lib/constants";
import type { PostWithRelations } from "@/types";
import { auth } from "@/lib/auth";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = params.tab || "latest";

  const session = tab === "following" ? await auth() : null;

  if (tab === "popular") {
    const likeCountExpr = sql<number>`(SELECT count(*) FROM "Like" WHERE "Like"."postId" = ${posts.id})`;

    const popularIds = await db
      .select({ postId: posts.id })
      .from(posts)
      .where(and(publicPostWhere, eq(posts.isAnnouncement, false)))
      .orderBy(desc(likeCountExpr))
      .limit(POSTS_PER_PAGE);

    let postResults: PostWithRelations[] = [];
    if (popularIds.length > 0) {
      const ids = popularIds.map((r) => r.postId);
      const fetched = await db.query.posts.findMany({
        where: inArray(posts.id, ids),
        with: {
          author: { columns: { id: true, username: true, name: true, image: true, role: true } },
          tags: { with: { tag: true } },
          comments: { columns: { id: true } },
          likes: { columns: { userId: true } },
        },
      });
      const orderMap = new Map(ids.map((id, i) => [id, i]));
      postResults = fetched
        .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
        .map((p) => ({
          ...p,
          _count: { comments: p.comments.length, likes: p.likes.length },
        })) as unknown as PostWithRelations[];
    }

    return (
      <div>
        <FeedTabs />
        <PostList
          initialPosts={postResults}
          initialHasMore={postResults.length === POSTS_PER_PAGE}
          fetchUrl="/api/feed?tab=popular"
        />
      </div>
    );
  }

  let whereCondition = and(publicPostWhere, eq(posts.isAnnouncement, false))!;

  if (tab === "following" && session?.user?.id) {
    const following = await db.query.follows.findMany({
      where: eq(follows.followerId, session.user.id),
      columns: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    if (followingIds.length > 0) {
      whereCondition = and(
        publicPostWhere,
        eq(posts.isAnnouncement, false),
        inArray(posts.authorId, followingIds),
      )!;
    } else {
      whereCondition = sql`false` as any;
    }
  }

  const postResults = await db.query.posts.findMany({
    where: whereCondition,
    orderBy: desc(posts.publishedAt),
    limit: POSTS_PER_PAGE,
    with: {
      author: { columns: { id: true, username: true, name: true, image: true, role: true } },
      tags: { with: { tag: true } },
      comments: { columns: { id: true } },
      likes: { columns: { userId: true } },
    },
  });

  const postsWithCounts = postResults.map((p) => ({
    ...p,
    _count: { comments: p.comments.length, likes: p.likes.length },
  }));

  const isFollowingNoAuth = tab === "following" && !session?.user;
  const fetchUrl = `/api/feed?tab=${tab}`;

  return (
    <div>
      <FeedTabs />
      {isFollowingNoAuth ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-[48px] text-gray-300 dark:text-[#dcddde]/20 mb-4">
            login
          </span>
          <p className="text-gray-400 dark:text-[#dcddde]/50 text-sm mb-4">
            팔로잉 피드를 보려면 로그인이 필요합니다.
          </p>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            로그인
          </Link>
        </div>
      ) : (
        <PostList
          initialPosts={postsWithCounts as unknown as PostWithRelations[]}
          initialHasMore={postsWithCounts.length === POSTS_PER_PAGE}
          fetchUrl={fetchUrl}
        />
      )}
    </div>
  );
}
