"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CommentForm } from "@/components/comment/comment-form";
import { deleteComment } from "@/actions/comment";
import { formatRelativeDate } from "@/lib/utils";
import { Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
};

export function CommentItem({
  comment,
  postId,
  currentUserId,
}: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initials = comment.author.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.image || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeDate(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowReply(!showReply)}
            >
              <Reply className="h-3 w-3 mr-1" />
              답글
            </Button>
            {currentUserId === comment.author.id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                삭제
              </Button>
            )}
          </div>
          {showReply && (
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onSuccess={() => setShowReply(false)}
            />
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l-2 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
