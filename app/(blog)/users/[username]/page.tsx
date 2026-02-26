import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { users, posts, likes, follows, series } from "@/lib/db/schema";
import { eq, and, or, ilike, desc, asc, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { PostCard } from "@/components/post/post-card";
import { FollowButton } from "@/components/user/follow-button";
import { FollowStats } from "@/components/user/follow-stats";
import { ProfilePostSearch } from "@/components/user/profile-post-search";
import type { PostWithRelations } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";

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
    columns: { name: true, username: true },
  });
  if (!user) return { title: "사용자를 찾을 수 없습니다" };
  return { title: `${user.name}의 프로필` };
}

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { q, tab } = await searchParams;
  const session = await auth();
  const cookieStore = await cookies();
  const isCustomDomain = !!cookieStore.get("x-custom-domain")?.value;

  const user = await db.query.users.findFirst({
    where: eq(users.username, cleanUsername(username)),
    columns: { id: true, username: true, name: true, image: true, bio: true, createdAt: true },
  });

  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;
  const validTabs = ["posts", "series", ...(isOwnProfile ? ["drafts"] : [])];
  const activeTab = validTabs.includes(tab || "") ? tab! : "posts";

  // 포스트 쿼리 조건
  const postWhereConditions = [eq(posts.authorId, user.id)];
  if (activeTab === "drafts") {
    postWhereConditions.push(eq(posts.published, false));
  } else {
    postWhereConditions.push(eq(posts.published, true));
  }
  if (q && activeTab !== "series") {
    postWhereConditions.push(
      or(ilike(posts.title, `%${q}%`), ilike(posts.content, `%${q}%`))!,
    );
  }
  const postWhere = and(...postWhereConditions);

  const [
    postResults,
    [{ postCount }],
    draftCountResult,
    [{ totalLikes }],
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
    db.select({ postCount: count() }).from(posts).where(and(eq(posts.authorId, user.id), eq(posts.published, true))),
    isOwnProfile
      ? db.select({ draftCount: count() }).from(posts).where(and(eq(posts.authorId, user.id), eq(posts.published, false)))
      : Promise.resolve([{ draftCount: 0 }]),
    db.select({ totalLikes: count() }).from(likes).innerJoin(posts, eq(likes.postId, posts.id)).where(eq(posts.authorId, user.id)),
    db.select({ followerCount: count() }).from(follows).where(eq(follows.followingId, user.id)),
    db.select({ followingCount: count() }).from(follows).where(eq(follows.followerId, user.id)),
    db.query.series.findMany({
      where: eq(series.authorId, user.id),
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

  const draftCount = draftCountResult[0].draftCount;

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
    activeTab === "drafts"
      ? (q ? `"${q}"에 대한 검색 결과가 없습니다.` : "임시저장된 글이 없습니다.")
      : activeTab === "series"
        ? "아직 시리즈가 없습니다."
        : (q ? `"${q}"에 대한 검색 결과가 없습니다.` : "아직 작성한 글이 없습니다.");

  return (
    <div className="w-full max-w-[768px] mx-auto py-12 md:py-16">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
        {user.image ? (
          <img src={user.image} alt={user.name || "User"} className="size-28 md:size-36 rounded-full object-cover flex-shrink-0 ring-2 ring-white/10" />
        ) : (
          <div className="size-28 md:size-36 rounded-full bg-white/10 flex items-center justify-center text-4xl font-bold text-slate-400 flex-shrink-0">
            {user.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div>
              <h2 className="text-3xl font-bold text-white">{user.name}</h2>
              <span className="text-slate-500 text-sm">@{user.username}</span>
            </div>
            {!isCustomDomain && !isOwnProfile && session?.user && (
              <FollowButton targetUserId={user.id} initialFollowing={isFollowing} />
            )}
          </div>
          {user.bio && <p className="text-slate-400 text-sm leading-relaxed">{user.bio}</p>}
          {!isCustomDomain && (
            <FollowStats
              username={user.username!}
              postCount={postCount}
              followerCount={followerCount}
              followingCount={followingCount}
              totalLikes={totalLikes}
            />
          )}
        </div>
      </div>

      {/* 탭 — 커스텀 도메인에서는 숨김 */}
      {!isCustomDomain && (
        <div className="border-b border-white/[0.08] mb-8">
          <div className="flex items-center justify-between pb-0">
            <div className="flex items-center gap-0">
              <Link
                href={`/users/@${user.username}`}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "posts"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                포스트
              </Link>
              <Link
                href={`/users/@${user.username}?tab=series`}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "series"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                시리즈
              </Link>
              {isOwnProfile && (
                <Link
                  href={`/users/@${user.username}?tab=drafts`}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === "drafts"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  임시저장
                  {draftCount > 0 && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/10">{draftCount}</span>
                  )}
                </Link>
              )}
            </div>
            {activeTab !== "series" && (
              <ProfilePostSearch initialQuery={q} username={user.username!} tab={activeTab} />
            )}
          </div>
        </div>
      )}

      {/* 시리즈 탭 */}
      {activeTab === "series" ? (
        userSeriesList.length === 0 ? (
          <p className="text-slate-500 text-center py-12">{emptyMessage}</p>
        ) : (
          <div className="space-y-4">
            {userSeriesList.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-xl border border-white/[0.08] bg-card hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-primary text-[18px]">auto_stories</span>
                      <h3 className="font-bold text-white truncate">{s.name}</h3>
                    </div>
                    {s.description && (
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">{s.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0 mt-1">
                    {s.posts.length}개의 글
                  </span>
                </div>
              </div>
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
              <PostCard post={post as unknown as PostWithRelations} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
