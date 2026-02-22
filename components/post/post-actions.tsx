"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Share2 } from "lucide-react";
import { toggleLike } from "@/actions/post";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PostActionsProps = {
  postId: string;
  initialLiked: boolean;
  initialLikeCount: number;
};

export function PostActions({
  postId,
  initialLiked,
  initialLikeCount,
}: PostActionsProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isPending, startTransition] = useTransition();

  function handleLike() {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    startTransition(async () => {
      const result = await toggleLike(postId);
      if (result.error) {
        setLiked(liked);
        setLikeCount(likeCount);
        toast.error(result.error);
      }
    });
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("링크가 복사되었습니다");
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={isPending}
        className={cn(liked && "text-red-500")}
      >
        <Heart className={cn("h-4 w-4 mr-1", liked && "fill-current")} />
        {likeCount}
      </Button>
      <Button variant="ghost" size="sm" onClick={handleShare}>
        <Share2 className="h-4 w-4 mr-1" />
        공유
      </Button>
    </div>
  );
}
