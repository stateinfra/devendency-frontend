"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getPosts, adminDeletePost } from "@/actions/admin";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  author: { name: string | null; username: string | null };
  _count: { comments: number; likes: number };
};

export function PostManagement() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPosts = useCallback(() => {
    startTransition(async () => {
      const result = await getPosts(page, search);
      setPosts(result.posts as Post[]);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    });
  }, [page, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const result = await adminDeletePost(deleteTarget.id);
    setDeleteLoading(false);
    if ("error" in result) {
      toast.error(result.error as string);
    } else {
      toast.success("게시글이 삭제되었습니다");
      setDeleteTarget(null);
      fetchPosts();
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="제목, 작성자 검색..."
          className="flex-1 h-10 px-3 rounded-lg border border-white/[0.06] bg-white/[0.04] text-sm text-[#dcddde] placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
        <button
          type="submit"
          className="h-10 px-4 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors"
        >
          검색
        </button>
      </form>

      <p className="text-sm text-[#dcddde]/50 mb-4">
        총 {total}개
      </p>

      <div className="border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-[#dcddde]/50 font-medium">제목</th>
                <th className="text-left px-4 py-3 text-[#dcddde]/50 font-medium">작성자</th>
                <th className="text-left px-4 py-3 text-[#dcddde]/50 font-medium">상태</th>
                <th className="text-left px-4 py-3 text-[#dcddde]/50 font-medium">반응</th>
                <th className="text-left px-4 py-3 text-[#dcddde]/50 font-medium">작성일</th>
                <th className="text-right px-4 py-3 text-[#dcddde]/50 font-medium">액션</th>
              </tr>
            </thead>
            <tbody className={isPending ? "opacity-50" : ""}>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/posts/${post.slug}`}
                      className="text-[#dcddde] hover:text-primary transition-colors font-medium line-clamp-1"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#dcddde]/50 text-xs">
                    {post.author.username
                      ? `@${post.author.username}`
                      : post.author.name || "알 수 없음"}
                  </td>
                  <td className="px-4 py-3">
                    {post.published ? (
                      <span className="text-xs text-emerald-400">공개</span>
                    ) : (
                      <span className="text-xs text-yellow-400">비공개</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#dcddde]/50 text-xs">
                    좋아요 {post._count.likes} · 댓글 {post._count.comments}
                  </td>
                  <td className="px-4 py-3 text-[#dcddde]/40 text-xs">
                    {format(new Date(post.createdAt), "yyyy.MM.dd")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setDeleteTarget(post)}
                        title="삭제"
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#dcddde]/50 hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && !isPending && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#dcddde]/30">
                    게시글이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 px-3 rounded-lg text-sm text-[#dcddde]/60 hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
          >
            이전
          </button>
          <span className="text-sm text-[#dcddde]/40">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-8 px-3 rounded-lg text-sm text-[#dcddde]/60 hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
          >
            다음
          </button>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="게시글 삭제"
        description={`"${deleteTarget?.title}" 게시글을 정말 삭제하시겠습니까? 댓글과 좋아요가 모두 삭제됩니다.`}
        confirmText="삭제"
        requiredInput={deleteTarget?.title}
        loading={deleteLoading}
      />
    </div>
  );
}
