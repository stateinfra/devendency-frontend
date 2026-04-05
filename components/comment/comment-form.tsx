"use client";

import { useState, useTransition } from "react";
import { createComment } from "@/actions/comment";
import { toast } from "sonner";

type CommentFormProps = {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
};

export function CommentForm({ postId, parentId, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    const formData = new FormData();
    formData.set("content", content);
    if (parentId) formData.set("parentId", parentId);

    startTransition(async () => {
      const result = await createComment(postId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        setContent("");
        onSuccess?.();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        placeholder="댓글을 작성해주세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full px-4 py-3 rounded-xl border border-black/[0.1] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.04] text-sm text-gray-900 dark:text-[#dcddde] placeholder:text-gray-400 dark:placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-colors"
      />
      <button
        type="submit"
        disabled={isPending || !content.trim()}
        className="px-4 py-2 rounded-full bg-primary hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "작성 중..." : "댓글 작성"}
      </button>
    </form>
  );
}
