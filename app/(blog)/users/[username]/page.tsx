import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { users, posts, likes, follows, series } from "@/lib/db/schema";
import { publicPostWhere } from "@/lib/db/post-visibility";
import { eq, and, or, ilike, desc, asc, count, gte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { PostCard } from "@/components/post/post-card";
import { FollowButton } from "@/components/user/follow-button";
import { FollowStats } from "@/components/user/follow-stats";
import { ProfilePostSearch } from "@/components/user/profile-post-search";
import { SocialLinks } from "@/components/user/social-links";
import { PostContributions } from "@/components/user/post-contributions";
import { BioMarkdown } from "@/components/user/bio-markdown";
import type { PostWithRelations } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ q?: string; tab?: string }>;
};

function cleanUsername(raw: string) {
  const decoded = decodeURIComponent(raw);
  return decoded.startsWith("@") ? decoded.slice(1) : decoded;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await db.query.users.findFirst({
    where: eq(users.username, cleanUsername(username)),
    columns: { name: true, username: true, image: true, bio: true },
  });
  if (!user) return { title: "사용자를 찾을 수 없습니다" };

  const url = `${SITE_CONFIG.url}/users/@${user.username}`;
  const description = user.bio || `${user.name}의 ${SITE_CONFIG.name} 프로필`;

  return {
    title: `${user.name}의 프로필`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${user.name}의 프로필`,
      description,
      url,
      type: "profile",
      ...(user.image ? { images: [{ url: user.image, alt: user.name || "" }] } : {}),
    },
  };
}

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { q, tab } = await searchParams;
  const session = await auth();

  const user = await db.query.users.findFirst({
    where: eq(users.username, cleanUsername(username)),
    columns: { id: true, username: true, name: true, image: true, bio: true, role: true, createdAt: true, github: true, linkedin: true, twitter: true, instagram: true },
  });

  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;
  const validTabs = ["posts", "series"];
  const activeTab = validTabs.includes(tab || "") ? tab! : "posts";

  // 포스트 쿼리 조건
  const postWhereConditions = [eq(posts.authorId, user.id), publicPostWhere];
  if (q && activeTab !== "series") {
    postWhereConditions.push(
      or(ilike(posts.title, `%${q}%`), ilike(posts.content, `%${q}%`))!,
    );
  }
  const postWhere = and(...postWhereConditions);

  // Last 365 days of publish activity
  const yearAgo = new Date();
  yearAgo.setDate(yearAgo.getDate() - 365);
  const contribRows = await db
    .select({
      day: sql<string>`to_char(${posts.publishedAt}, 'YYYY-MM-DD')`,
      c: count(),
    })
    .from(posts)
    .where(
      and(
        eq(posts.authorId, user.id),
        publicPostWhere,
        gte(posts.publishedAt, yearAgo),
      ),
    )
    .groupBy(sql`to_char(${posts.publishedAt}, 'YYYY-MM-DD')`);
  const contributionCounts: Record<string, number> = {};
  for (const r of contribRows) contributionCounts[r.day] = Number(r.c);

  const [
    postResults,
    [{ postCount }],
    [{ followerCount }],
    [{ followingCount }],
    userSeriesList,
  ] = await Promise.all([
    activeTab !== "series"
      ? db.query.posts.findMany({
          where: postWhere,
          orderBy: desc(posts.createdAt),
          with: {
            author: { columns: { id: true, username: true, name: true, image: true } },
            tags: { with: { tag: true } },
            comments: { columns: { id: true } },
            likes: { columns: { userId: true } },
          },
        })
      : Promise.resolve([]),
    db.select({ postCount: count() }).from(posts).where(and(eq(posts.authorId, user.id), publicPostWhere)),
    db.select({ followerCount: count() }).from(follows).where(eq(follows.followingId, user.id)),
    db.select({ followingCount: count() }).from(follows).where(eq(follows.followerId, user.id)),
    db.query.series.findMany({
      where: isOwnProfile
        ? eq(series.authorId, user.id)
        : and(eq(series.authorId, user.id), eq(series.visibility, "public")),
      orderBy: desc(series.createdAt),
      with: {
        posts: {
          where: eq(posts.published, true),
          orderBy: asc(posts.seriesOrder),
          columns: { id: true },
        },
      },
    }),
  ]);

  const postsWithCounts = postResults.map((p: any) => ({
    ...p,
    _count: { comments: p.comments.length, likes: p.likes.length },
  }));

  const isFollowing =
    session?.user && session.user.id !== user.id
      ? !!(await db.query.follows.findFirst({
          where: and(eq(follows.followerId, session.user.id), eq(follows.followingId, user.id)),
        }))
      : false;

  const emptyMessage =
    activeTab === "series"
      ? "아직 시리즈가 없습니다."
      : (q ? `"${q}"에 대한 검색 결과가 없습니다.` : "아직 작성한 글이 없습니다.");

  return (
    <div className="w-full max-w-6xl mx-auto py-6 sm:py-10 md:py-14 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 lg:gap-10 items-start">
        {/* 좌측: 프로필 정보 (sticky on PC) */}
        <aside className="lg:sticky lg:top-20 lg:h-fit space-y-4">
          {/* 모바일: 아바타 + 이름·통계 가로 / PC: 아바타만 단독 */}
          <div className="flex items-start gap-4 lg:block lg:space-y-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="size-20 sm:size-24 lg:size-32 rounded-full object-cover ring-2 ring-black/10 dark:ring-white/10 flex-shrink-0"
              />
            ) : (
              <div className="size-20 sm:size-24 lg:size-32 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-3xl font-bold text-gray-400 dark:text-slate-400 flex-shrink-0">
                {user.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="space-y-0.5 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{user.name}</span>
                  {user.role === "ADMIN" && (
                    <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>verified</span>
                  )}
                </h2>
                <p className="text-slate-500 text-sm truncate">@{user.username}</p>
              </div>
              <FollowStats
                username={user.username!}
                postCount={postCount}
                followerCount={followerCount}
                followingCount={followingCount}
              />
            </div>
          </div>
          {user.bio && <BioMarkdown content={user.bio} />}
          <SocialLinks
            github={user.github}
            linkedin={user.linkedin}
            twitter={user.twitter}
            instagram={user.instagram}
          />
          {!isOwnProfile && session?.user && (
            <FollowButton targetUserId={user.id} initialFollowing={isFollowing} />
          )}
        </aside>

        {/* 우측: 잔디 → 탭 → 컨텐츠 */}
        <main className="min-w-0 space-y-6">
          <div className="hidden lg:block">
            <PostContributions counts={contributionCounts} />
          </div>

          <div className="border-b border-black/[0.08] dark:border-white/[0.08]">
            <div className="flex items-center justify-between pb-0">
              <div className="flex items-center gap-0">
                <Link
                  href={`/users/@${user.username}`}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "posts"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                  }`}
                >
                  포스트
                </Link>
                <Link
                  href={`/users/@${user.username}?tab=series`}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "series"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                  }`}
                >
                  시리즈
                </Link>
              </div>
              {activeTab !== "series" && (
                <ProfilePostSearch initialQuery={q} username={user.username!} tab={activeTab} />
              )}
            </div>
          </div>

          {activeTab === "series" ? (
            userSeriesList.length === 0 ? (
              <p className="text-slate-500 text-center py-12">{emptyMessage}</p>
            ) : (
              <div className="space-y-4">
                {userSeriesList.map((s) => (
                  <Link
                    key={s.id}
                    href={`/series/${s.slug}`}
                    className="block p-5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-card hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="material-symbols-outlined text-primary text-[18px]">book_2</span>
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">{s.name}</h3>
                          {isOwnProfile && s.visibility === "private" && (
                            <span className="px-2 py-0.5 text-[11px] rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                              Private
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0 mt-1">
                        {s.posts.length}개의 글
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : postsWithCounts.length === 0 ? (
            <p className="text-slate-500 text-center py-12">{emptyMessage}</p>
          ) : (
            <div className="space-y-4">
              {postsWithCounts.map((post: any) => (
                <div key={post.id} className="relative">
                  {!post.published && <span className="absolute top-3 right-3 z-10 px-2 py-0.5 text-[11px] font-medium rounded bg-slate-700 text-slate-300">임시저장</span>}
                  <PostCard post={post as unknown as PostWithRelations} hideThumbnail hideAuthor />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
