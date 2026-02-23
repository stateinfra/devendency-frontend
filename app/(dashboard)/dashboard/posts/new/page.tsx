import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "새 글 작성",
};

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allTags = await db.query.tags.findMany({ orderBy: asc(tags.name) });

  return <MarkdownEditor tags={allTags} />;
}
