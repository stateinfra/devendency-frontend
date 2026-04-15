import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tags, series } from "@/lib/db/schema";
import { asc, and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "새 글 작성",
};

type Props = {
  searchParams: Promise<{ series?: string }>;
};

export default async function NewPostPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { series: seriesIdParam } = await searchParams;

  const [allTags, targetSeries] = await Promise.all([
    db.query.tags.findMany({ orderBy: asc(tags.name) }),
    seriesIdParam
      ? db.query.series.findFirst({
          where: and(eq(series.id, seriesIdParam), eq(series.authorId, session.user.id)),
          columns: { id: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <MarkdownEditor
      tags={allTags}
      userSeries={[]}
      initialData={targetSeries ? { seriesId: targetSeries.id } : undefined}
      seriesLabel={targetSeries?.name ?? null}
    />
  );
}
