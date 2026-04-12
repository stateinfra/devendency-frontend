"use server";

import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { and, eq, or, ilike, desc } from "drizzle-orm";

/** Autocomplete source for wiki-link [[...]] suggestions. */
export async function searchPostsForAutocomplete(q: string) {
  const query = q.trim();
  const where = query
    ? and(
        eq(posts.published, true),
        or(ilike(posts.title, `%${query}%`), ilike(posts.slug, `%${query}%`)),
      )
    : eq(posts.published, true);

  const rows = await db
    .select({ slug: posts.slug, title: posts.title })
    .from(posts)
    .where(where)
    .orderBy(desc(posts.publishedAt))
    .limit(10);

  return rows;
}
