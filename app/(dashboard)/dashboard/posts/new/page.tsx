import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tags, series } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "새 글 작성",
};

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [allTags, userSeries] = await Promise.all([
    db.query.tags.findMany({ orderBy: asc(tags.name) }),
    db.query.series.findMany({
      where: eq(series.authorId, session.user.id),
      orderBy: asc(series.createdAt),
      columns: { id: true, name: true },
    }),
  ]);

  return <MarkdownEditor tags={allTags} userSeries={userSeries} />;
}
