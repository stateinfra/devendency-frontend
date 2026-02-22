import { prisma } from "@/lib/prisma";
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
        <p className="text-muted-foreground">검색어를 입력해주세요.</p>
      </div>
    );
  }

  const where = {
    published: true as const,
    OR: [
      { title: { contains: query, mode: "insensitive" as const } },
      { content: { contains: query, mode: "insensitive" as const } },
    ],
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: POSTS_PER_PAGE,
      skip: (page - 1) * POSTS_PER_PAGE,
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true, likes: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">검색 결과</h1>
      <p className="text-muted-foreground mb-8">
        &quot;{query}&quot;에 대한 검색 결과 {total}건
      </p>
      <PostList
        posts={posts as unknown as PostWithRelations[]}
        currentPage={page}
        totalPages={totalPages}
        baseUrl={`/search?q=${encodeURIComponent(query)}`}
      />
    </div>
  );
}
