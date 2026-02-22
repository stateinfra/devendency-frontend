import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { title: true, excerpt: true },
  });

  if (!post) return { title: "글을 찾을 수 없습니다" };

  return {
    title: post.title,
    description: post.excerpt || undefined,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, username: true, name: true, image: true, bio: true } },
      tags: { include: { tag: true } },
      comments: {
        where: { parentId: null },
        include: {
          author: { select: { id: true, name: true, image: true } },
          replies: {
            include: {
              author: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { likes: true } },
    },
  });

  if (!post || (!post.published && post.authorId !== session?.user?.id)) {
    notFound();
  }

  const liked = session?.user
    ? !!(await prisma.like.findUnique({
        where: {
          userId_postId: { userId: session.user.id, postId: post.id },
        },
      }))
    : false;

  const isAuthor = session?.user?.id === post.authorId;

  return (
    <LikeProvider postId={post.id} initialLiked={liked} initialLikeCount={post._count.likes}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        {/* Left Sidebar - Actions + ToC */}
        <aside className="hidden lg:block lg:col-span-3 relative">
          <div className="sticky top-28 space-y-8">
            <PostActions variant="sidebar" />
            <TableOfContents content={post.content} />
          </div>
        </aside>

        {/* Article */}
        <article className="col-span-1 lg:col-span-9 max-w-[760px] mx-auto w-full">
          {/* Article Header */}
          <header className="mb-10">
            {/* Tags */}
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

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight text-white leading-tight mb-6 break-keep">
              {post.title}
            </h1>

            {/* Author & Date */}
            <div className="flex items-center justify-between py-4 border-b border-white/[0.08]">
              <Link
                href={`/users/@${post.author.username}`}
                className="flex items-center gap-3 group"
              >
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

          {/* Content */}
          <PostContent content={post.content} />

          {/* Bottom Like Section */}
          <div className="mt-16 pt-8 border-t border-white/[0.08]">
            <div className="flex justify-center mb-8">
              <PostActions variant="bottom" />
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="lg:hidden my-8">
            <PostActions variant="inline" />
          </div>

          {/* Comments */}
          <div className="mt-8">
            <CommentList
              postId={post.id}
              comments={post.comments}
              currentUserId={session?.user?.id}
            />
          </div>
        </article>
      </div>
    </LikeProvider>
  );
}
