import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { series, posts } from "@/lib/db/schema";
import { eq, asc, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SeriesManager } from "@/components/series/series-manager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "시리즈 관리",
};

export default async function SeriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userSeries = await db.query.series.findMany({
    where: eq(series.authorId, session.user.id),
    orderBy: asc(series.createdAt),
    columns: {
      id: true,
      name: true,
      slug: true,
      visibility: true,
    },
    with: {
      posts: {
        orderBy: asc(posts.seriesOrder),
        columns: { id: true, title: true, slug: true, seriesOrder: true, published: true },
      },
    },
  });

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">시리즈 관리</h1>
      <SeriesManager initialSeries={userSeries} />
    </div>
  );
}
