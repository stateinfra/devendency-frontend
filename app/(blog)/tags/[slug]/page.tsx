import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { tags, posts, postTags } from "@/lib/db/schema";
import { publicPostWhere } from "@/lib/db/post-visibility";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import { PostList } from "@/components/post/post-list";
import { POSTS_PER_PAGE } from "@/lib/constants";
import type { PostWithRelations } from "@/types";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const tag = await db.query.tags.findFirst({ where: eq(tags.slug, decodedSlug) });
  if (!tag) return { title: "태그를 찾을 수 없습니다" };
  return { title: `#${tag.name}` };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const tag = await db.query.tags.findFirst({ where: eq(tags.slug, slug) });
  if (!tag) notFound();

  // PostTag JOIN으로 해당 태그의 postId 목록 조회
  const taggedPostIds = await db
    .select({ postId: postTags.postId })
    .from(postTags)
    .where(eq(postTags.tagId, tag.id));

  const ids = taggedPostIds.map((r) => r.postId);

  if (ids.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8">#{tag.name}</h1>
        <PostList posts={[]} currentPage={1} totalPages={0} baseUrl={`/tags/${slug}`} />
      </div>
    );
  }

  const whereCondition = and(publicPostWhere, inArray(posts.id, ids));

  const [postResults, [{ total }]] = await Promise.all([
    db.query.posts.findMany({
      where: whereCondition,
      orderBy: desc(posts.publishedAt),
      limit: POSTS_PER_PAGE,
      offset: (page - 1) * POSTS_PER_PAGE,
      with: {
        author: { columns: { id: true, name: true, image: true } },
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

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">#{tag.name}</h1>
      <PostList
        posts={postsWithCounts as unknown as PostWithRelations[]}
        currentPage={page}
        totalPages={totalPages}
        baseUrl={`/tags/${slug}`}
        singleColumn
      />
    </div>
  );
}
