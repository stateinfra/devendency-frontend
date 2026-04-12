import { db } from "@/lib/db";
import { posts, postTags, tags, users } from "@/lib/db/schema";
import { and, eq, or, ilike, desc, sql, exists, inArray } from "drizzle-orm";
import { POSTS_PER_PAGE } from "@/lib/constants";
import { parseQueryTerms, escapeLike, makeSnippet } from "@/lib/search-snippet";
import { SearchResult } from "@/components/post/search-result-item";
import { Pagination } from "@/components/shared/pagination";
import type { Metadata } from "next";

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `"${q}" 검색 결과` : "검색" };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = (sp.q || "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  if (!query) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">검색</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-2">검색어를 입력해주세요.</p>
        <p className="text-xs text-slate-500 dark:text-slate-500">
          여러 단어는 모두 포함된 글을 찾습니다. 큰따옴표(&quot;…&quot;)로 구절 검색.
        </p>
      </div>
    );
  }

  const terms = parseQueryTerms(query);
  const likeTerms = terms.map((t) => `%${escapeLike(t)}%`);

  // Each term must match somewhere: title, content, author name/username, or a tag name
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

  const whereCondition = and(eq(posts.published, true), ...termConditions);

  // Score: title hits (×5) + tag hits (×3) + content hits (×1). Additive per term.
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

  const totalRows = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(posts)
    .where(whereCondition);
  const total = Number(totalRows[0]?.total ?? 0);

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
    .offset((page - 1) * POSTS_PER_PAGE);

  // Batch-load author info + tags + counts
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

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">검색 결과</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        &quot;{query}&quot;에 대한 검색 결과 {total}건
      </p>
      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          일치하는 글이 없습니다.
          <div className="text-xs mt-2 text-slate-500">
            제목·본문·태그·작성자 이름에서 검색합니다.
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((p) => (
              <SearchResult key={p.slug} post={p} terms={terms} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl={`/search?q=${encodeURIComponent(query)}`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
