import { prisma } from "@/lib/prisma";
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

  // Build query based on tab
  let where: Record<string, unknown> = { published: true };
  let orderBy: Record<string, unknown> = { publishedAt: "desc" as const };

  if (tab === "popular") {
    orderBy = { likes: { _count: "desc" as const } };
  }

  if (tab === "following" && session?.user?.id) {
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    where = { published: true, authorId: { in: followingIds } };
  }

  const [posts, total, popularTags] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      take: POSTS_PER_PAGE,
      skip: (page - 1) * POSTS_PER_PAGE,
      include: {
        author: { select: { id: true, username: true, name: true, image: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true, likes: true } },
      },
    }),
    prisma.post.count({ where }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      take: 8,
    }),
  ]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);
  const isFollowingNoAuth = tab === "following" && !session?.user;
  const baseUrl = tab !== "latest" ? `/?tab=${tab}` : "/";

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Posts */}
        <div className="lg:col-span-8">
          <FeedTabs />
          {isFollowingNoAuth ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#dcddde]/20 mb-4">
                login
              </span>
              <p className="text-[#dcddde]/50 text-sm mb-4">
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
              posts={posts as unknown as PostWithRelations[]}
              currentPage={page}
              totalPages={totalPages}
              baseUrl={baseUrl}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 space-y-8 pl-4">
          {popularTags.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-xs font-semibold text-[#dcddde]/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-xs">tag</span>
                태그
              </h3>
              <div className="flex flex-col gap-1">
                {popularTags.map((tag: { id: string; name: string; slug: string }) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#dcddde]/70 hover:text-[#dcddde] hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="text-primary/60">#</span>
                    {tag.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/tags"
                className="mt-2 flex items-center justify-center gap-1 py-2 text-xs text-[#dcddde]/40 hover:text-primary transition-colors"
              >
                더보기
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
