import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { posts, likes, comments } from "@/lib/db/schema";
import { eq, and, isNull, desc, asc, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { PostContent } from "@/components/post/post-content";
import { PostActions } from "@/components/post/post-actions";
import { LikeProvider } from "@/components/post/like-context";
import { DeletePostButton } from "@/components/post/delete-post-button";
import { AnnouncementToggle } from "@/components/post/announcement-toggle";
import { TableOfContents } from "@/components/post/table-of-contents";
import { SeriesNav } from "@/components/post/series-nav";
import { ScrollToTop } from "@/components/post/scroll-to-top";
import { ScrollProgress } from "@/components/post/scroll-progress";
import { SkeletonImage } from "@/components/shared/skeleton-image";
import { CommentList } from "@/components/comment/comment-list";
import { formatDate, extractFirstImage } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/constants";
import Link from "next/link";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    columns: {
      title: true,
      content: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      updatedAt: true,
    },
    with: {
      author: { columns: { name: true } },
      tags: { with: { tag: { columns: { name: true } } } },
    },
  });
  if (!post) return { title: "글을 찾을 수 없습니다" };

  const url = `${SITE_CONFIG.url}/posts/${slug}`;
  const ogImage = post.coverImage || extractFirstImage(post.content || "");

  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      url,
      type: "article",
      publishedTime: (post.publishedAt || post.updatedAt)?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: post.tags?.map(({ tag }) => tag.name),
      ...(ogImage
        ? { images: [{ url: ogImage, alt: post.title }] }
        : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: post.title,
      description: post.excerpt || undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    with: {
      author: {
        columns: { id: true, username: true, name: true, image: true, bio: true, role: true },
      },
      tags: { with: { tag: true } },
      series: true,
    },
  });

  if (!post || (!post.published && post.authorId !== session?.user?.id)) {
    notFound();
  }

  // 시리즈가 있으면 같은 시리즈의 글 목록 조회
  const seriesPosts = post.series
    ? await db.query.posts.findMany({
        where: and(eq(posts.seriesId, post.series.id), eq(posts.published, true)),
        orderBy: asc(posts.seriesOrder),
        columns: { id: true, title: true, slug: true, seriesOrder: true },
      })
    : [];

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
  const isAdmin = session?.user?.role === "ADMIN";

  const isDraft = !post.published;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.coverImage ? { image: post.coverImage } : {}),
    datePublished: (post.publishedAt || post.createdAt).toISOString(),
    dateModified: (post.updatedAt || post.createdAt).toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name,
      url: `${SITE_CONFIG.url}/users/@${post.author.username}`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    description: post.excerpt || undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_CONFIG.url}/posts/${slug}`,
    },
    ...(post.tags.length > 0
      ? { keywords: post.tags.map(({ tag }) => tag.name).join(", ") }
      : {}),
  };

  return (
    <LikeProvider postId={post.id} initialLiked={liked} initialLikeCount={likeCount}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 relative max-w-[1200px] mx-auto">
        <aside className="hidden lg:block lg:col-span-3 relative z-40">
          <div className="sticky top-24 space-y-8">
            {!isDraft && <PostActions variant="sidebar" markdownContent={post.content} />}
            <TableOfContents content={post.content} />
          </div>
        </aside>

        <article className="col-span-1 lg:col-span-9 max-w-[760px] mx-auto w-full relative">
          {isDraft && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800/40 text-yellow-700 dark:text-yellow-300 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              이 글은 임시저장 상태입니다. 본인만 볼 수 있습니다.
            </div>
          )}

          {/* 시리즈 네비게이션 */}
          {post.series && seriesPosts.length > 0 && (
            <div className="mb-8">
              <SeriesNav
                seriesName={post.series.name}
                seriesSlug={post.series.slug}
                posts={seriesPosts}
                currentPostId={post.id}
              />
            </div>
          )}

          {/* 표지 이미지 */}
          {post.coverImage && (
            <div className="mb-10 rounded-2xl overflow-hidden">
              <SkeletonImage
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
                  className="px-2.5 py-1 bg-black/5 dark:bg-white/5 rounded-lg text-xs text-gray-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-primary transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight text-gray-900 dark:text-white leading-tight mb-6 break-keep">
              {post.title}
            </h1>

            <div className="flex items-center justify-between py-4 border-b border-black/[0.08] dark:border-white/[0.08]">
              <Link href={`/users/@${post.author.username}`} className="flex items-center gap-3 group">
                {post.author.image ? (
                  <SkeletonImage
                    src={post.author.image}
                    alt={post.author.name || "Author"}
                    className="size-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/30 transition-all"
                  />
                ) : (
                  <div className="size-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-slate-400">
                    {post.author.name?.[0]?.toUpperCase() || "A"}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-primary transition-colors inline-flex items-center gap-1">
                      {post.author.name}
                      {post.author.role === "ADMIN" && (
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>verified</span>
                      )}
                    </span>
                    <span className="text-xs text-slate-500">
                      &middot; {formatDate(post.publishedAt || post.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
              {(isAuthor || isAdmin) && (
                <div className="flex items-center gap-1 [&>*]:shrink-0 relative z-[60]">
                  {isAdmin && (
                    <AnnouncementToggle postId={post.id} initialIsAnnouncement={post.isAnnouncement} />
                  )}
                  {isAuthor && (
                    <>
                      <Link
                        href={`/dashboard/posts/${post.id}/edit`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-transparent text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all leading-none box-border"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18, width: 18, height: 18, lineHeight: "18px" }}>edit</span>
                      </Link>
                      <DeletePostButton postId={post.id} />
                    </>
                  )}
                </div>
              )}
            </div>
          </header>

          <PostContent content={post.content} />

          {/* 시리즈 하단 네비게이션 (시리즈가 있는 경우 반복) */}
          {post.series && seriesPosts.length > 0 && (
            <div className="mt-12">
              <SeriesNav
                seriesName={post.series.name}
                seriesSlug={post.series.slug}
                posts={seriesPosts}
                currentPostId={post.id}
              />
            </div>
          )}

          {!isDraft && (
            <div className="mt-16 pt-8 border-t border-black/[0.08] dark:border-white/[0.08]">
              <div className="flex justify-center mb-8">
                <PostActions variant="bottom" />
              </div>
            </div>
          )}

          {!isDraft && (
            <div className="lg:hidden my-8">
              <PostActions variant="inline" markdownContent={post.content} />
            </div>
          )}

          {!isDraft && (
            <div className="mt-8 w-full">
              <CommentList postId={post.id} comments={topComments} currentUserId={session?.user?.id} />
            </div>
          )}
        </article>
      </div>
      <ScrollProgress />
      <ScrollToTop />
    </LikeProvider>
  );
}
