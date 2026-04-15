import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { series, posts, users } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/constants";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await db.query.series.findFirst({
    where: eq(series.slug, slug),
    columns: { name: true, visibility: true },
  });
  if (!s || s.visibility === "private") {
    return { title: "시리즈를 찾을 수 없습니다" };
  }
  return {
    title: s.name,
    alternates: { canonical: `${SITE_CONFIG.url}/series/${slug}` },
  };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const s = await db.query.series.findFirst({
    where: eq(series.slug, slug),
    with: {
      author: {
        columns: { id: true, username: true, name: true, image: true, role: true },
      },
    },
  });

  if (!s) notFound();
  const isAuthor = session?.user?.id === s.authorId;
  if (s.visibility === "private" && !isAuthor) notFound();

  const seriesPosts = await db.query.posts.findMany({
    where: isAuthor
      ? eq(posts.seriesId, s.id)
      : and(eq(posts.seriesId, s.id), eq(posts.published, true)),
    orderBy: asc(posts.seriesOrder),
    columns: {
      id: true,
      title: true,
      slug: true,
      seriesOrder: true,
      publishedAt: true,
      createdAt: true,
      published: true,
      excerpt: true,
    },
  });

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4">
      {/* 레포 헤더 */}
      <div className="pb-6 mb-8 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 flex-wrap">
              <Link
                href={`/users/@${s.author.username}`}
                className="hover:text-primary transition-colors"
              >
                {s.author.username}
              </Link>
              <span>/</span>
              <span className="font-bold text-gray-900 dark:text-white">{s.name}</span>
              <span
                className={`ml-2 px-2 py-0.5 text-[11px] rounded-full border ${
                  s.visibility === "public"
                    ? "border-black/[0.12] dark:border-white/[0.12] text-slate-500"
                    : "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {s.visibility === "public" ? "Public" : "Private"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>{seriesPosts.length}개의 글</span>
              <span>·</span>
              <span>{formatDate(s.updatedAt)} 업데이트</span>
            </div>
          </div>
          {isAuthor && (
            <Link
              href={`/dashboard/series/${s.slug}`}
              className="inline-flex items-center justify-center size-9 rounded-lg border border-black/[0.12] dark:border-white/[0.12] text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors flex-shrink-0"
              title="시리즈 관리"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </Link>
          )}
        </div>
      </div>

      {/* 포스트 목록 */}
      <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
        <div className="px-5 py-3 border-b border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-[18px] text-slate-500">
              article
            </span>
            <span className="font-medium text-gray-700 dark:text-slate-300">글</span>
            <span className="text-xs text-slate-500">{seriesPosts.length}개</span>
          </div>
          {isAuthor && (
            <Link
              href={`/dashboard/posts/new?series=${s.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              글 쓰기
            </Link>
          )}
        </div>
        {seriesPosts.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12">
            아직 글이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {seriesPosts.map((p, i) => (
              <li
                key={p.id}
                className="px-5 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              >
                <Link href={`/posts/${p.slug}`} className="flex items-start gap-3 group">
                  <span className="text-xs text-slate-500 tabular-nums w-6 flex-shrink-0 pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                        {p.title}
                      </span>
                      {!p.published && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-slate-400 flex-shrink-0">
                          비공개
                        </span>
                      )}
                    </div>
                    {p.excerpt && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{p.excerpt}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0 pt-0.5 tabular-nums">
                    {formatDate(p.publishedAt || p.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
