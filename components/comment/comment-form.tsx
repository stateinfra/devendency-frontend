"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        placeholder="댓글을 작성해주세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <Button type="submit" size="sm" disabled={isPending || !content.trim()}>
        {isPending ? "작성 중..." : "댓글 작성"}
      </Button>
    </form>
  );
}
