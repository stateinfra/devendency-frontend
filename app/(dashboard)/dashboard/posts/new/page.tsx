import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "새 글 작성",
};

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user || !["WRITER", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">새 글 작성</h1>
      <MarkdownEditor categories={categories} tags={tags} />
    </div>
  );
}
