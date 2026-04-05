"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSeries, updateSeries, deleteSeries } from "@/actions/series";
import { toast } from "sonner";
import Link from "next/link";

type SeriesPost = {
  id: string;
  title: string;
  slug: string;
  seriesOrder: number | null;
  published: boolean;
};

type SeriesItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  function handleCreate() {
    if (!newName.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", newName.trim());
      formData.set("description", newDescription.trim());
      const result = await createSeries(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("시리즈가 생성되었습니다");
        setNewName("");
        setNewDescription("");
        setShowCreate(false);
        router.refresh();
      }
    });
  }

  function handleEdit(s: SeriesItem) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditDescription(s.description || "");
  }

  function handleUpdate() {
    if (!editingId || !editName.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", editName.trim());
      formData.set("description", editDescription.trim());
      const result = await updateSeries(editingId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("시리즈가 수정되었습니다");
        setEditingId(null);
        router.refresh();
      }
    });
  }

  function handleDelete(seriesId: string, name: string) {
    if (!confirm(`"${name}" 시리즈를 삭제하시겠습니까? 글은 삭제되지 않습니다.`)) return;
    startTransition(async () => {
      const result = await deleteSeries(seriesId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("시리즈가 삭제되었습니다");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* 생성 버튼/폼 */}
      {showCreate ? (
        <div className="p-5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-card space-y-3">
          <input
            placeholder="시리즈 이름"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-primary/30"
            autoFocus
          />
          <input
            placeholder="설명 (선택)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-primary/30"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              disabled={isPending || !newName.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-40"
            >
              생성
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName(""); setNewDescription(""); }}
              className="px-4 py-2 rounded-lg text-slate-400 text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-black/10 dark:border-white/10 text-slate-400 text-sm hover:border-black/20 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white transition-colors w-full justify-center"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          새 시리즈 만들기
        </button>
      )}

      {/* 시리즈 목록 */}
      {initialSeries.length === 0 && !showCreate && (
        <p className="text-slate-500 text-center py-8">아직 시리즈가 없습니다.</p>
      )}

      {initialSeries.map((s) => (
        <div
          key={s.id}
          className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-card overflow-hidden"
        >
          {editingId === s.id ? (
            <div className="p-5 space-y-3">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:ring-1 focus:ring-primary/30"
                autoFocus
              />
              <input
                placeholder="설명 (선택)"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-primary/30"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUpdate}
                  disabled={isPending || !editName.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-40"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 rounded-lg text-slate-400 text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">auto_stories</span>
                    <h3 className="font-bold text-gray-900 dark:text-white">{s.name}</h3>
                  </div>
                  {s.description && (
                    <p className="text-sm text-slate-400 mt-1">{s.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(s)}
                    className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    disabled={isPending}
                    className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>

              {/* 시리즈 내 글 목록 */}
              {s.posts.length > 0 ? (
                <div className="space-y-1 mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                  {s.posts.map((post, i) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <span className="text-slate-600 text-xs w-5">{i + 1}.</span>
                      <Link
                        href={`/posts/${post.slug}`}
                        className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors truncate flex-1"
                      >
                        {post.title}
                      </Link>
                      {!post.published && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-slate-400">
                          비공개
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 mt-2">글이 없습니다</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
