import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts, users, tags } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
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

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    with: { tags: { with: { tag: true } } },
  });

  if (!post) notFound();

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { role: true },
  });
  const isAdmin = dbUser && ["ADMIN", "SUPER_ADMIN"].includes(dbUser.role);
  if (post.authorId !== session.user.id && !isAdmin) {
    redirect("/");
  }

  const allTags = await db.query.tags.findMany({ orderBy: asc(tags.name) });

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
      tags={allTags}
    />
  );
}
