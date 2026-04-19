import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { tags, posts, postTags } from "@/lib/db/schema";
import { publicPostWhere } from "@/lib/db/post-visibility";
import { eq, and, desc, inArray } from "drizzle-orm";
import { PostList } from "@/components/post/post-list";
import { POSTS_PER_PAGE } from "@/lib/constants";
import type { PostWithRelations } from "@/types";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const tag = await db.query.tags.findFirst({ where: eq(tags.slug, decodedSlug) });
  if (!tag) return { title: "태그를 찾을 수 없습니다" };
  return { title: `#${tag.name}` };
}

export default async function TagPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const tag = await db.query.tags.findFirst({ where: eq(tags.slug, slug) });
  if (!tag) notFound();

  const taggedPostIds = await db
    .select({ postId: postTags.postId })
    .from(postTags)
    .where(eq(postTags.tagId, tag.id));

  const ids = taggedPostIds.map((r) => r.postId);
  const fetchUrl = `/api/feed?tag=${encodeURIComponent(slug)}`;

  if (ids.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8">#{tag.name}</h1>
        <PostList
          initialPosts={[]}
          initialHasMore={false}
          fetchUrl={fetchUrl}
          singleColumn
        />
      </div>
    );
  }

  const whereCondition = and(publicPostWhere, inArray(posts.id, ids));

  const postResults = await db.query.posts.findMany({
    where: whereCondition,
    orderBy: desc(posts.publishedAt),
    limit: POSTS_PER_PAGE,
    with: {
      author: { columns: { id: true, name: true, image: true } },
      tags: { with: { tag: true } },
      comments: { columns: { id: true } },
      likes: { columns: { userId: true } },
    },
  });

  const postsWithCounts = postResults.map((p) => ({
    ...p,
    _count: { comments: p.comments.length, likes: p.likes.length },
  }));

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">#{tag.name}</h1>
      <PostList
        initialPosts={postsWithCounts as unknown as PostWithRelations[]}
        initialHasMore={postsWithCounts.length === POSTS_PER_PAGE}
        fetchUrl={fetchUrl}
        singleColumn
      />
    </div>
  );
}
