import { db } from "@/lib/db";
import { tags, postTags } from "@/lib/db/schema";
import { asc, exists, sql, eq } from "drizzle-orm";
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
        posts: sql<number>`(SELECT count(*) FROM "PostTag" WHERE "PostTag"."tagId" = "Tag"."id")::int`,
      },
    })
    .from(tags)
    .where(
      exists(
        db
          .select({ one: sql`1` })
          .from(postTags)
          .where(eq(postTags.tagId, tags.id)),
      ),
    )
    .orderBy(asc(tags.name));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-[#dcddde] mb-1">태그</h1>
        <p className="text-sm text-[#dcddde]/40">{allTags.length}개의 태그</p>
      </div>
      {allTags.length === 0 ? (
        <p className="text-[#dcddde]/40">등록된 태그가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allTags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="group flex items-center justify-between px-4 py-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/20 transition-all"
            >
              <span className="flex items-center gap-2">
                <span className="text-primary/50 group-hover:text-primary transition-colors">#</span>
                <span className="text-[#dcddde]/80 group-hover:text-[#dcddde] transition-colors">{tag.name}</span>
              </span>
              <span className="text-xs text-[#dcddde]/30 tabular-nums">{tag._count.posts}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
