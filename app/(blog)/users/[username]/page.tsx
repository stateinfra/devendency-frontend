import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PostCard } from "@/components/post/post-card";
import { FollowButton } from "@/components/user/follow-button";
import { ProfilePostSearch } from "@/components/user/profile-post-search";
import type { PostWithRelations } from "@/types";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ q?: string }>;
};

function cleanUsername(raw: string) {
  const decoded = decodeURIComponent(raw);
  return decoded.startsWith("@") ? decoded.slice(1) : decoded;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username: cleanUsername(username) },
    select: { name: true, username: true },
  });
  if (!user) return { title: "사용자를 찾을 수 없습니다" };
  return { title: `${user.name}의 프로필` };
}

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { q } = await searchParams;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { username: cleanUsername(username) },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;

  const postWhere = {
    authorId: user.id,
    ...(isOwnProfile ? {} : { published: true }),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { content: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [posts, postCount, totalLikes, followerCount, followingCount] =
    await Promise.all([
      prisma.post.findMany({
        where: postWhere,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, username: true, name: true, image: true },
          },
          tags: { include: { tag: true } },
          _count: { select: { comments: true, likes: true } },
        },
      }),
      prisma.post.count({ where: { authorId: user.id, published: true } }),
      prisma.like.count({
        where: { post: { authorId: user.id } },
      }),
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
    ]);

  const isFollowing =
    session?.user && session.user.id !== user.id
      ? !!(await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: user.id,
            },
          },
        }))
      : false;

  return (
    <div className="w-full max-w-[768px] mx-auto py-12 md:py-16">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="size-28 md:size-36 rounded-full object-cover flex-shrink-0 ring-2 ring-white/10"
          />
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
            {!isOwnProfile && session?.user && (
              <FollowButton
                targetUserId={user.id}
                initialFollowing={isFollowing}
              />
            )}
          </div>

          {user.bio && (
            <p className="text-slate-400 text-lg leading-relaxed">
              {user.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
            <div className="flex gap-1.5 items-center">
              <span className="font-bold text-white">{postCount}</span>
              <span className="text-slate-500">포스트</span>
            </div>
            <div className="flex gap-1.5 items-center">
              <span className="font-bold text-white">{followerCount}</span>
              <span className="text-slate-500">팔로워</span>
            </div>
            <div className="flex gap-1.5 items-center">
              <span className="font-bold text-white">{followingCount}</span>
              <span className="text-slate-500">팔로잉</span>
            </div>
            <div className="flex gap-1.5 items-center">
              <span className="font-bold text-white">{totalLikes}</span>
              <span className="text-slate-500">좋아요</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab + Search */}
      <div className="border-b border-white/[0.08] mb-8">
        <div className="flex items-center justify-between pb-3">
          <span className="border-b-2 border-primary text-primary font-bold text-base">
            포스트
          </span>
          <ProfilePostSearch initialQuery={q} username={user.username!} />
        </div>
      </div>

      {/* Post List */}
      {posts.length === 0 ? (
        <p className="text-slate-500 text-center py-12">
          {q ? `"${q}"에 대한 검색 결과가 없습니다.` : "아직 작성한 글이 없습니다."}
        </p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="relative">
              {!post.published && (
                <span className="absolute top-3 right-3 z-10 px-2 py-0.5 text-[11px] font-medium rounded bg-slate-700 text-slate-300">
                  임시저장
                </span>
              )}
              <PostCard post={post as unknown as PostWithRelations} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
