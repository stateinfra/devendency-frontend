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
  if (!session?.user) redirect("/login");

  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  return <MarkdownEditor tags={tags} />;
}
