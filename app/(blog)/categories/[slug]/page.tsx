import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "카테고리를 찾을 수 없습니다" };
  return { title: category.name };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true, categoryId: category.id },
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
    prisma.post.count({
      where: { published: true, categoryId: category.id },
    }),
  ]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
      {category.description && (
        <p className="text-muted-foreground mb-8">{category.description}</p>
      )}
      <PostList
        posts={posts as unknown as PostWithRelations[]}
        currentPage={page}
        totalPages={totalPages}
        baseUrl={`/categories/${slug}`}
      />
    </div>
  );
}
