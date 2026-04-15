"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  updateSeries,
  deleteSeries,
  setSeriesVisibility,
} from "@/actions/series";
import { Button, Input, Icon } from "@/components/ds";

type SeriesPost = {
  id: string;
  title: string;
  slug: string;
  seriesOrder: number | null;
  published: boolean;
};

type SeriesData = {
  id: string;
  name: string;
  slug: string;
  visibility: "public" | "private";
  posts: SeriesPost[];
};

export function SeriesEditor({ series: s }: { series: SeriesData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(s.name);
  const [nameEditing, setNameEditing] = useState(false);

  function handleRename() {
    if (!name.trim() || name === s.name) {
      setNameEditing(false);
      setName(s.name);
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name.trim());
      const result = await updateSeries(s.id, formData);
      if (result.error) {
        toast.error(result.error);
        setName(s.name);
      } else {
        toast.success("시리즈 이름이 수정되었습니다");
        setNameEditing(false);
        router.refresh();
      }
    });
  }

  function handleToggleVisibility() {
    const next = s.visibility === "public" ? "private" : "public";
    const label = next === "public" ? "공개" : "비공개";
    if (
      next === "public" &&
      !confirm(`"${s.name}"을(를) 공개로 전환하시겠습니까? 소속된 공개 글이 모두 조회 가능해집니다.`)
    )
      return;
    startTransition(async () => {
      const result = await setSeriesVisibility(s.id, next);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`${label}로 전환되었습니다`);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!confirm(`"${s.name}" 시리즈를 삭제하시겠습니까? 글은 삭제되지 않습니다.`)) return;
    startTransition(async () => {
      const result = await deleteSeries(s.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("시리즈가 삭제되었습니다");
        router.push("/dashboard/series");
      }
    });
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      {/* 빵부스러기 */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/series" className="hover:text-primary transition-colors">
          시리즈
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium truncate">{s.name}</span>
      </div>

      {/* 헤더: 이름 + visibility + 공개 페이지 링크 */}
      <div className="pb-6 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {nameEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") {
                      setNameEditing(false);
                      setName(s.name);
                    }
                  }}
                />
                <Button size="sm" onClick={handleRename} disabled={isPending}>
                  저장
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNameEditing(false);
                    setName(s.name);
                  }}
                >
                  취소
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <Icon name="book_2" size="lg" className="text-primary flex-shrink-0" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {s.name}
                </h1>
                <button
                  onClick={() => setNameEditing(true)}
                  className="text-slate-500 hover:text-primary transition-colors"
                  title="이름 수정"
                >
                  <Icon name="edit" size="sm" />
                </button>
                <span
                  className={`px-2 py-0.5 text-[11px] rounded-full border flex items-center gap-1 ${
                    s.visibility === "public"
                      ? "border-black/[0.12] dark:border-white/[0.12] text-slate-500"
                      : "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  <Icon name={s.visibility === "public" ? "lock_open" : "lock"} size="xs" />
                  {s.visibility === "public" ? "Public" : "Private"}
                </span>
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <Link
                href={`/series/${s.slug}`}
                className="inline-flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Icon name="open_in_new" size="xs" />
                공개 페이지 보기
              </Link>
              <span>·</span>
              <span>{s.posts.length}개의 글</span>
            </div>
          </div>
        </div>
      </div>

      {/* visibility 섹션 */}
      <section className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon
                name={s.visibility === "public" ? "lock_open" : "lock"}
                size="sm"
                className="text-slate-500"
              />
              공개 범위
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {s.visibility === "public"
                ? "소속된 공개 글이 모두 조회 가능합니다."
                : "소속된 글은 작성자 본인만 볼 수 있습니다."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleVisibility}
            disabled={isPending}
          >
            {s.visibility === "public" ? "Private으로 전환" : "Public으로 전환"}
          </Button>
        </div>
      </section>

      {/* 포스트 목록 */}
      <section className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center gap-2 text-sm">
          <Icon name="article" size="sm" className="text-slate-500" />
          <span className="font-medium text-gray-700 dark:text-slate-300">글 목록</span>
          <span className="text-xs text-slate-500 ml-auto">{s.posts.length}개</span>
        </div>
        {s.posts.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">아직 글이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {s.posts.map((p, i) => (
              <li key={p.id} className="px-5 py-2.5 flex items-center gap-3">
                <span className="text-xs text-slate-500 tabular-nums w-6 flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Link
                  href={`/posts/${p.slug}`}
                  className="flex-1 min-w-0 text-sm text-gray-700 dark:text-slate-300 hover:text-primary transition-colors truncate"
                >
                  {p.title}
                </Link>
                {!p.published && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-slate-400 flex-shrink-0">
                    비공개
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 위험 영역 */}
      <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
          <Icon name="warning" size="sm" />
          위험 영역
        </h2>
        <div className="mt-3 flex items-start justify-between gap-4">
          <p className="text-xs text-slate-500">
            시리즈를 삭제해도 소속된 글은 삭제되지 않습니다. 글에서 시리즈 연결만 제거됩니다.
          </p>
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={isPending}>
            시리즈 삭제
          </Button>
        </div>
      </section>
    </div>
  );
}
