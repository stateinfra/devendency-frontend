"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSeries } from "@/actions/series";
import { toast } from "sonner";
import Link from "next/link";
import { Button, Input, Radio, Icon } from "@/components/ds";

type SeriesPost = {
  id: string;
  title: string;
  slug: string;
  seriesOrder: number | null;
  published: boolean;
};

type SeriesVisibility = "public" | "private";

type SeriesItem = {
  id: string;
  name: string;
  slug: string;
  visibility: SeriesVisibility;
  posts: SeriesPost[];
};

export function SeriesManager({
  initialSeries,
}: {
  initialSeries: SeriesItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newVisibility, setNewVisibility] = useState<SeriesVisibility>("public");

  function handleCreate() {
    if (!newName.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", newName.trim());
      formData.set("visibility", newVisibility);
      const result = await createSeries(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("시리즈가 생성되었습니다");
        setNewName("");
        setNewVisibility("public");
        setShowCreate(false);
        if (result.series?.slug) {
          router.push(`/dashboard/series/${result.series.slug}`);
        } else {
          router.refresh();
        }
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* 생성 */}
      {showCreate ? (
        <div className="p-5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-card space-y-3">
          <Input
            placeholder="시리즈 이름"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">공개 범위:</span>
            <Radio
              name="new-vis"
              checked={newVisibility === "public"}
              onChange={() => setNewVisibility("public")}
              label="Public"
            />
            <Radio
              name="new-vis"
              checked={newVisibility === "private"}
              onChange={() => setNewVisibility("private")}
              label="Private"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreate}
              disabled={isPending || !newName.trim()}
              size="sm"
            >
              생성
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreate(false);
                setNewName("");
                setNewVisibility("public");
              }}
            >
              취소
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowCreate(true)}
          className="w-full border-dashed"
        >
          <Icon name="add" size="md" />
          새 시리즈 만들기
        </Button>
      )}

      {/* 목록 */}
      {initialSeries.length === 0 && !showCreate && (
        <p className="text-slate-500 text-center py-8">아직 시리즈가 없습니다.</p>
      )}

      <div className="space-y-2">
        {initialSeries.map((s) => (
          <Link
            key={s.id}
            href={`/dashboard/series/${s.slug}`}
            className="flex items-center gap-3 p-4 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-card hover:border-primary/40 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
          >
            <Icon name="book_2" size="lg" className="text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 dark:text-white truncate">
                  {s.name}
                </span>
                <span
                  className={`px-2 py-0.5 text-[11px] rounded-full border flex items-center gap-1 flex-shrink-0 ${
                    s.visibility === "public"
                      ? "border-black/[0.12] dark:border-white/[0.12] text-slate-500"
                      : "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  <Icon name={s.visibility === "public" ? "lock_open" : "lock"} size="xs" />
                  {s.visibility === "public" ? "Public" : "Private"}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {s.posts.length}개의 글
              </div>
            </div>
            <Icon name="chevron_right" size="md" className="text-slate-400 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
