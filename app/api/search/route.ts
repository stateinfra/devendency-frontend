import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, postTags, tags, users } from "@/lib/db/schema";
import { publicPostWhere } from "@/lib/db/post-visibility";
import { and, eq, or, ilike, desc, sql, exists, inArray } from "drizzle-orm";
import { POSTS_PER_PAGE } from "@/lib/constants";
import { parseQueryTerms, escapeLike, makeSnippet } from "@/lib/search-snippet";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const offset = (page - 1) * POSTS_PER_PAGE;

  if (!query) return NextResponse.json({ items: [], hasMore: false });

  const terms = parseQueryTerms(query);
  const likeTerms = terms.map((t) => `%${escapeLike(t)}%`);

  const termConditions = likeTerms.map((lt) =>
    or(
      ilike(posts.title, lt),
      ilike(posts.content, lt),
      exists(
        db
          .select({ one: sql`1` })
          .from(users)
          .where(
            and(
              eq(users.id, posts.authorId),
              or(ilike(users.name, lt), ilike(users.username, lt)),
            ),
          ),
      ),
      exists(
        db
          .select({ one: sql`1` })
          .from(postTags)
          .innerJoin(tags, eq(tags.id, postTags.tagId))
          .where(and(eq(postTags.postId, posts.id), ilike(tags.name, lt))),
      ),
    ),
  );

  const whereCondition = and(publicPostWhere, ...termConditions);

  const scoreExpr = sql<number>`(${sql.join(
    likeTerms.map(
      (lt) => sql`(
        (CASE WHEN ${posts.title} ILIKE ${lt} THEN 5 ELSE 0 END) +
        (CASE WHEN ${posts.content} ILIKE ${lt} THEN 1 ELSE 0 END) +
        (CASE WHEN EXISTS(
          SELECT 1 FROM "PostTag" pt
          INNER JOIN "Tag" t ON t.id = pt."tagId"
          WHERE pt."postId" = ${posts.id} AND t.name ILIKE ${lt}
        ) THEN 3 ELSE 0 END)
      )`,
    ),
    sql` + `,
  )})`;

  const results = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      content: posts.content,
      excerpt: posts.excerpt,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      score: scoreExpr,
    })
    .from(posts)
    .where(whereCondition)
    .orderBy(desc(scoreExpr), desc(posts.publishedAt))
    .limit(POSTS_PER_PAGE)
    .offset(offset);

  const postIds = results.map((r) => r.id);
  const authorIds = [...new Set(results.map((r) => r.authorId))];

  const [authorsList, tagsList, likeCounts, commentCounts] = await Promise.all([
    authorIds.length
      ? db
          .select({ id: users.id, name: users.name, username: users.username, image: users.image })
          .from(users)
          .where(inArray(users.id, authorIds))
      : [],
    postIds.length
      ? db
          .select({ postId: postTags.postId, name: tags.name })
          .from(postTags)
          .innerJoin(tags, eq(tags.id, postTags.tagId))
          .where(inArray(postTags.postId, postIds))
      : [],
    postIds.length
      ? db.execute<{ postId: string; c: number }>(
          sql`SELECT "postId", count(*)::int AS c FROM "Like" WHERE "postId" IN (${sql.join(postIds.map((id) => sql`${id}`), sql`, `)}) GROUP BY "postId"`,
        )
      : [],
    postIds.length
      ? db.execute<{ postId: string; c: number }>(
          sql`SELECT "postId", count(*)::int AS c FROM "Comment" WHERE "postId" IN (${sql.join(postIds.map((id) => sql`${id}`), sql`, `)}) GROUP BY "postId"`,
        )
      : [],
  ]);

  const authorMap = new Map(authorsList.map((a) => [a.id, a]));
  const tagsMap = new Map<string, string[]>();
  for (const { postId, name } of tagsList) {
    if (!tagsMap.has(postId)) tagsMap.set(postId, []);
    tagsMap.get(postId)!.push(name);
  }
  const likeMap = new Map((likeCounts as any[]).map((r) => [r.postId, Number(r.c)]));
  const commentMap = new Map((commentCounts as any[]).map((r) => [r.postId, Number(r.c)]));

  const items = results.map((p) => {
    const author = authorMap.get(p.authorId) ?? { id: "", name: "", username: "", image: null };
    return {
      slug: p.slug,
      title: p.title,
      snippet: makeSnippet(p.excerpt || p.content || "", terms),
      author: { name: author.name, username: author.username, image: author.image },
      publishedAt: p.publishedAt,
      createdAt: p.createdAt,
      likeCount: likeMap.get(p.id) ?? 0,
      commentCount: commentMap.get(p.id) ?? 0,
      tags: tagsMap.get(p.id) ?? [],
    };
  });

  return NextResponse.json({ items, hasMore: items.length === POSTS_PER_PAGE, terms });
}
