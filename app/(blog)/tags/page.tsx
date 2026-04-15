import { db } from "@/lib/db";
import { tags, postTags, posts } from "@/lib/db/schema";
import { publicPostWhere } from "@/lib/db/post-visibility";
import { asc, exists, sql, eq, and } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "태그",
};

export default async function TagsPage() {
  const allTags = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      _count: {
        posts: sql<number>`(SELECT count(*) FROM "PostTag" pt INNER JOIN "Post" p ON p."id" = pt."postId" LEFT JOIN "Series" s ON s."id" = p."seriesId" WHERE pt."tagId" = "Tag"."id" AND p."published" = true AND (p."seriesId" IS NULL OR s."visibility" = 'public'))::int`,
      },
    })
    .from(tags)
    .where(
      exists(
        db
          .select({ one: sql`1` })
          .from(postTags)
          .innerJoin(posts, eq(posts.id, postTags.postId))
          .where(and(eq(postTags.tagId, tags.id), publicPostWhere)),
      ),
    )
    .orderBy(asc(tags.name));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#dcddde] mb-1">태그</h1>
        <p className="text-sm text-gray-500 dark:text-[#dcddde]/40">{allTags.length}개의 태그</p>
      </div>
      {allTags.length === 0 ? (
        <p className="text-gray-500 dark:text-[#dcddde]/40">등록된 태그가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allTags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="group flex items-center justify-between px-4 py-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] hover:border-primary/20 transition-all"
            >
              <span className="flex items-center gap-2">
                <span className="text-primary/50 group-hover:text-primary transition-colors">#</span>
                <span className="text-gray-700 dark:text-[#dcddde]/80 group-hover:text-gray-900 dark:group-hover:text-[#dcddde] transition-colors">{tag.name}</span>
              </span>
              <span className="text-xs text-gray-400 dark:text-[#dcddde]/30 tabular-nums">{tag._count.posts}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
