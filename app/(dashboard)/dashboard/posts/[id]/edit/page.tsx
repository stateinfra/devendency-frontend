import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "글 수정",
};

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const post = await prisma.post.findUnique({
    where: { id },
    include: { tags: true },
  });

  if (!post) notFound();
  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/dashboard/posts");
  }

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">글 수정</h1>
      <MarkdownEditor
        postId={post.id}
        initialData={{
          title: post.title,
          content: post.content,
          excerpt: post.excerpt || "",
          categoryId: post.categoryId || "",
          tagIds: post.tags.map((t) => t.tagId),
          published: post.published,
        }}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
