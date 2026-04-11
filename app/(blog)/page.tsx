import { db } from "@/lib/db";
import { posts, follows } from "@/lib/db/schema";
import { eq, desc, and, inArray, sql, count } from "drizzle-orm";
import { PostList } from "@/components/post/post-list";
import { FeedTabs } from "@/components/post/feed-tabs";
import { POSTS_PER_PAGE } from "@/lib/constants";
import type { PostWithRelations } from "@/types";
import { auth } from "@/lib/auth";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ page?: string; tab?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const tab = params.tab || "latest";

  const session = tab === "following" ? await auth() : null;

  // ── popular 탭: db.select()로 정렬된 ID 목록 → 관계 쿼리 ──
  if (tab === "popular") {
    const likeCountExpr = sql<number>`(SELECT count(*) FROM "Like" WHERE "Like"."postId" = ${posts.id})`;

    const [popularIds, [{ total }]] = await Promise.all([
      db
        .select({ postId: posts.id })
        .from(posts)
        .where(and(eq(posts.published, true), eq(posts.isAnnouncement, false)))
        .orderBy(desc(likeCountExpr))
        .limit(POSTS_PER_PAGE)
        .offset((page - 1) * POSTS_PER_PAGE),
      db.select({ total: count() }).from(posts).where(and(eq(posts.published, true), eq(posts.isAnnouncement, false))),
    ]);

    const totalPages = Math.ceil(total / POSTS_PER_PAGE);

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
      // 원래 인기순 정렬 복원
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
          posts={postResults}
          currentPage={page}
          totalPages={totalPages}
          baseUrl="/?tab=popular"
        />
      </div>
    );
  }

  // ── latest / following 탭 ──
  let whereCondition = and(eq(posts.published, true), eq(posts.isAnnouncement, false))!;

  if (tab === "following" && session?.user?.id) {
    const following = await db.query.follows.findMany({
      where: eq(follows.followerId, session.user.id),
      columns: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    if (followingIds.length > 0) {
      whereCondition = and(
        eq(posts.published, true),
        eq(posts.isAnnouncement, false),
        inArray(posts.authorId, followingIds),
      )!;
    } else {
      whereCondition = sql`false` as any;
    }
  }

  const [postResults, [{ total }]] = await Promise.all([
    db.query.posts.findMany({
      where: whereCondition,
      orderBy: desc(posts.publishedAt),
      limit: POSTS_PER_PAGE,
      offset: (page - 1) * POSTS_PER_PAGE,
      with: {
        author: { columns: { id: true, username: true, name: true, image: true, role: true } },
        tags: { with: { tag: true } },
        comments: { columns: { id: true } },
        likes: { columns: { userId: true } },
      },
    }),
    db.select({ total: count() }).from(posts).where(whereCondition),
  ]);

  const postsWithCounts = postResults.map((p) => ({
    ...p,
    _count: { comments: p.comments.length, likes: p.likes.length },
  }));

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);
  const isFollowingNoAuth = tab === "following" && !session?.user;
  const baseUrl = tab !== "latest" ? `/?tab=${tab}` : "/";

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
          posts={postsWithCounts as unknown as PostWithRelations[]}
          currentPage={page}
          totalPages={totalPages}
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
}
