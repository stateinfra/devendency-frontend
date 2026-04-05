import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, and, or, ilike, desc, count } from "drizzle-orm";
import { PostList } from "@/components/post/post-list";
import { POSTS_PER_PAGE } from "@/lib/constants";
import type { PostWithRelations } from "@/types";
import type { Metadata } from "next";

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `"${q}" 검색 결과` : "검색" };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = sp.q || "";
  const page = Math.max(1, Number(sp.page) || 1);

  if (!query.trim()) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">검색</h1>
        <p className="text-slate-500 dark:text-slate-400">검색어를 입력해주세요.</p>
      </div>
    );
  }

  const whereCondition = and(
    eq(posts.published, true),
    or(ilike(posts.title, `%${query}%`), ilike(posts.content, `%${query}%`)),
  );

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
      <h1 className="text-3xl font-bold mb-2">검색 결과</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        &quot;{query}&quot;에 대한 검색 결과 {total}건
      </p>
      <PostList
        posts={postsWithCounts as unknown as PostWithRelations[]}
        currentPage={page}
        totalPages={totalPages}
        baseUrl={`/search?q=${encodeURIComponent(query)}`}
        singleColumn
      />
    </div>
  );
}
