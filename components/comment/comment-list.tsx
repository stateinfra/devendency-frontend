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
  postSlug?: string;
  comments: Comment[];
  currentUserId?: string;
  isCustomDomain?: boolean;
};

export function CommentList({
  postId,
  postSlug,
  comments,
  currentUserId,
  isCustomDomain,
}: CommentListProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-[#dcddde] flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#dcddde]/40">chat_bubble</span>
        댓글 {comments.length}개
      </h3>
      {isCustomDomain ? (
        <a
          href={`https://devendency.com/posts/${postSlug || postId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-[#dcddde]/60 hover:bg-white/[0.04] hover:text-[#dcddde] transition-colors"
        >
          <svg className="size-4 text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor" />
          </svg>
          Devendency에서 댓글 작성
        </a>
      ) : (
        <CommentForm postId={postId} />
      )}
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
