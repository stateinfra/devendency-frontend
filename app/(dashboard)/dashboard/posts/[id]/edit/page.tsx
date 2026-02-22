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
    include: { tags: { include: { tag: true } } },
  });

  if (!post) notFound();

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const isAdmin = dbUser && ["ADMIN", "SUPER_ADMIN"].includes(dbUser.role);
  if (post.authorId !== session.user.id && !isAdmin) {
    redirect("/");
  }

  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  return (
    <MarkdownEditor
      postId={post.id}
      initialData={{
        title: post.title,
        content: post.content,
        tagNames: post.tags.map((t) => t.tag.name),
        published: post.published,
        slug: post.slug,
      }}
      tags={tags}
    />
  );
}
