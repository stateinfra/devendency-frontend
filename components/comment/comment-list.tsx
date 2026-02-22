"use client";

import { CommentItem } from "@/components/comment/comment-item";
import { CommentForm } from "@/components/comment/comment-form";

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string | null; image: string | null };
  replies: {
    id: string;
    content: string;
    createdAt: Date;
    author: { id: string; name: string | null; image: string | null };
  }[];
};

type CommentListProps = {
  postId: string;
  comments: Comment[];
  currentUserId?: string;
};

export function CommentList({
  postId,
  comments,
  currentUserId,
}: CommentListProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-[#dcddde] flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#dcddde]/40">chat_bubble</span>
        댓글 {comments.length}개
      </h3>
      <CommentForm postId={postId} />
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}
