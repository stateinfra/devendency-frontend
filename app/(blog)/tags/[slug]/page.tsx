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
  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) return { title: "태그를 찾을 수 없습니다" };
  return { title: `#${tag.name}` };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) notFound();

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        published: true,
        tags: { some: { tagId: tag.id } },
      },
      orderBy: { publishedAt: "desc" },
      take: POSTS_PER_PAGE,
      skip: (page - 1) * POSTS_PER_PAGE,
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true, likes: true } },
      },
    }),
    prisma.post.count({
      where: {
        published: true,
        tags: { some: { tagId: tag.id } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">#{tag.name}</h1>
      <PostList
        posts={posts as unknown as PostWithRelations[]}
        currentPage={page}
        totalPages={totalPages}
        baseUrl={`/tags/${slug}`}
      />
    </div>
  );
}
