import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { series, posts } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { SeriesEditor } from "@/components/series/series-editor";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await db.query.series.findFirst({
    where: eq(series.slug, slug),
    columns: { name: true },
  });
  return { title: s ? `${s.name} — 관리` : "시리즈 관리" };
}

export default async function SeriesEditPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const s = await db.query.series.findFirst({
    where: eq(series.slug, slug),
    columns: {
      id: true,
      name: true,
      slug: true,
      visibility: true,
      authorId: true,
    },
  });

  if (!s) notFound();
  if (s.authorId !== session.user.id) redirect("/dashboard/series");

  const seriesPosts = await db.query.posts.findMany({
    where: eq(posts.seriesId, s.id),
    orderBy: asc(posts.seriesOrder),
    columns: {
      id: true,
      title: true,
      slug: true,
      seriesOrder: true,
      published: true,
    },
  });

  return <SeriesEditor series={{ ...s, posts: seriesPosts }} />;
}
