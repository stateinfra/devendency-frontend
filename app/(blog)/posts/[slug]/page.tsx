import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { posts, likes, comments } from "@/lib/db/schema";
import { eq, and, isNull, desc, asc, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { PostContent } from "@/components/post/post-content";
import { PostActions } from "@/components/post/post-actions";
import { LikeProvider } from "@/components/post/like-context";
import { DeletePostButton } from "@/components/post/delete-post-button";
import { TableOfContents } from "@/components/post/table-of-contents";
import { CommentList } from "@/components/comment/comment-list";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    columns: { title: true, excerpt: true, coverImage: true },
  });
  if (!post) return { title: "글을 찾을 수 없습니다" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: post.coverImage
      ? { images: [{ url: post.coverImage }] }
      : undefined,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    with: {
      author: {
        columns: { id: true, username: true, name: true, image: true, bio: true },
      },
      tags: { with: { tag: true } },
    },
  });

  if (!post || (!post.published && post.authorId !== session?.user?.id)) {
    notFound();
  }

  const [[{ likeCount }], topComments, likedRow] = await Promise.all([
    db.select({ likeCount: count() }).from(likes).where(eq(likes.postId, post.id)),
    db.query.comments.findMany({
      where: and(eq(comments.postId, post.id), isNull(comments.parentId)),
      orderBy: desc(comments.createdAt),
      with: {
        author: { columns: { id: true, name: true, image: true } },
        replies: {
          orderBy: asc(comments.createdAt),
          with: {
            author: { columns: { id: true, name: true, image: true } },
          },
        },
      },
    }),
    session?.user
      ? db.query.likes.findFirst({
          where: and(eq(likes.userId, session.user.id), eq(likes.postId, post.id)),
        })
      : Promise.resolve(null),
  ]);

  const liked = !!likedRow;
  const isAuthor = session?.user?.id === post.authorId;

  return (
    <LikeProvider postId={post.id} initialLiked={liked} initialLikeCount={likeCount}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        <aside className="hidden lg:block lg:col-span-3 relative">
          <div className="sticky top-28 space-y-8">
            <PostActions variant="sidebar" />
            <TableOfContents content={post.content} />
          </div>
        </aside>

        <article className="col-span-1 lg:col-span-9 max-w-[760px] mx-auto w-full">
          {/* 표지 이미지 */}
          {post.coverImage && (
            <div className="mb-10 rounded-2xl overflow-hidden">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full object-cover max-h-[480px]"
              />
            </div>
          )}

          <header className="mb-10">
            <div className="flex items-center gap-2 text-sm mb-6 font-medium flex-wrap">
              {post.tags.map(({ tag }) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug}`}
                  className="px-2.5 py-1 bg-white/5 rounded-lg text-xs text-slate-400 hover:bg-white/10 hover:text-primary transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight text-white leading-tight mb-6 break-keep">
              {post.title}
            </h1>

            <div className="flex items-center justify-between py-4 border-b border-white/[0.08]">
              <Link href={`/users/@${post.author.username}`} className="flex items-center gap-3 group">
                {post.author.image ? (
                  <img
                    src={post.author.image}
                    alt={post.author.name || "Author"}
                    className="size-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/30 transition-all"
                  />
                ) : (
                  <div className="size-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-slate-400">
                    {post.author.name?.[0]?.toUpperCase() || "A"}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm group-hover:text-primary transition-colors">
                      {post.author.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      &middot; {formatDate(post.publishedAt || post.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
              {isAuthor && (
                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/posts/${post.id}/edit`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    수정
                  </Link>
                  <DeletePostButton postId={post.id} />
                </div>
              )}
            </div>
          </header>

          <PostContent content={post.content} />

          <div className="mt-16 pt-8 border-t border-white/[0.08]">
            <div className="flex justify-center mb-8">
              <PostActions variant="bottom" />
            </div>
          </div>

          <div className="lg:hidden my-8">
            <PostActions variant="inline" />
          </div>

          <div className="mt-8">
            <CommentList postId={post.id} comments={topComments} currentUserId={session?.user?.id} />
          </div>
        </article>
      </div>
    </LikeProvider>
  );
}
