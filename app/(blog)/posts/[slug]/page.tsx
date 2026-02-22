import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PostContent } from "@/components/post/post-content";
import { PostActions } from "@/components/post/post-actions";
import { CommentList } from "@/components/comment/comment-list";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { Eye } from "lucide-react";
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
      author: { select: { id: true, name: true, image: true, bio: true } },
      category: { select: { id: true, name: true, slug: true } },
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

  // Increment view count (fire-and-forget)
  prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  const liked = session?.user
    ? !!(await prisma.like.findUnique({
        where: {
          userId_postId: { userId: session.user.id, postId: post.id },
        },
      }))
    : false;

  const initials = post.author.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "A";

  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8 space-y-4">
        {post.category && (
          <Link href={`/categories/${post.category.slug}`}>
            <Badge variant="secondary">{post.category.name}</Badge>
          </Link>
        )}
        <h1 className="text-4xl font-bold">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.author.image || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">
            {post.author.name}
          </span>
          <span>&middot;</span>
          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
          <span>&middot;</span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {post.viewCount}
          </span>
        </div>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map(({ tag }) => (
              <Link key={tag.id} href={`/tags/${tag.slug}`}>
                <Badge variant="outline">{tag.name}</Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      <PostContent content={post.content} />

      <div className="my-8">
        <PostActions
          postId={post.id}
          initialLiked={liked}
          initialLikeCount={post._count.likes}
        />
      </div>

      <Separator className="my-8" />

      <CommentList
        postId={post.id}
        comments={post.comments}
        currentUserId={session?.user?.id}
      />
    </article>
  );
}
