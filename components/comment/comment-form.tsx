"use client";

import { useState, useTransition, useRef } from "react";
import { createComment } from "@/actions/comment";
import { toast } from "sonner";
import { Button, Textarea } from "@/components/ds";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type CommentFormProps = {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
};

export function CommentForm({ postId, parentId, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [token, setToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    if (TURNSTILE_SITE_KEY && !token) {
      toast.error("보안 인증을 완료해주세요");
      return;
    }

    const formData = new FormData();
    formData.set("content", content);
    formData.set("turnstileToken", token);
    if (parentId) formData.set("parentId", parentId);

    startTransition(async () => {
      const result = await createComment(postId, formData);
      turnstileRef.current?.reset();
      setToken("");
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
      <Textarea
        placeholder="댓글을 작성해주세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      {TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={setToken}
          onExpire={() => setToken("")}
          options={{ theme: "auto", size: "flexible" }}
        />
      )}
      <div className="flex justify-end">
        <Button
          type="submit"
          pill
          disabled={!content.trim()}
          loading={isPending}
        >
          {isPending ? "작성 중..." : "댓글 작성"}
        </Button>
      </div>
    </form>
  );
}
