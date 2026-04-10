"use client";

import { useState, useTransition } from "react";
import { CommentForm } from "@/components/comment/comment-form";
import { deleteComment } from "@/actions/comment";
import { formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Avatar, Button } from "@/components/ds";

type CommentItemProps = {
  comment: {
    id: string;
    content: string;
    createdAt: Date;
    author: { id: string; name: string | null; image: string | null };
    replies?: {
      id: string;
      content: string;
      createdAt: Date;
      author: { id: string; name: string | null; image: string | null };
    }[];
  };
  postId: string;
  currentUserId?: string;
  isReply?: boolean;
};

export function CommentItem({
  comment,
  postId,
  currentUserId,
  isReply,
}: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (result.error) toast.error(result.error);
      setShowDeleteModal(false);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar
          src={comment.author.image || undefined}
          initial={comment.author.name?.[0]?.toUpperCase() || "U"}
          size="sm"
          className="flex-shrink-0"
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900 dark:text-[#dcddde]">
              {comment.author.name}
            </span>
            <span className="text-xs text-gray-400 dark:text-[#dcddde]/30">
              {formatRelativeDate(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-[#dcddde]/70 whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="flex gap-2 pt-1">
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReply(!showReply)}
                className="text-xs text-gray-400 dark:text-[#dcddde]/30 hover:text-primary"
              >
                <span className="material-symbols-outlined text-[14px]">reply</span>
                답글
              </Button>
            )}
            {currentUserId === comment.author.id && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isPending}
                  className="text-xs text-gray-400 dark:text-[#dcddde]/30 hover:text-red-500"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  삭제
                </Button>
                <ConfirmModal
                  open={showDeleteModal}
                  onClose={() => setShowDeleteModal(false)}
                  onConfirm={handleDelete}
                  title="댓글을 삭제하시겠습니까?"
                  description="삭제된 댓글은 복구할 수 없습니다."
                  loading={isPending}
                />
              </>
            )}
          </div>
          {showReply && (
            <div className="pt-2">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onSuccess={() => setShowReply(false)}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 sm:ml-11 space-y-3 border-l-2 border-black/[0.06] dark:border-white/[0.06] pl-3 sm:pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
