"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { toggleLike } from "@/actions/post";
import { toast } from "sonner";

type LikeContextType = {
  liked: boolean;
  likeCount: number;
  isPending: boolean;
  handleLike: () => void;
};

const LikeContext = createContext<LikeContextType | null>(null);

export function useLike() {
  const ctx = useContext(LikeContext);
  if (!ctx) throw new Error("useLike must be used within LikeProvider");
  return ctx;
}

export function LikeProvider({
  postId,
  initialLiked,
  initialLikeCount,
  children,
}: {
  postId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  children: ReactNode;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isPending, startTransition] = useTransition();

  function handleLike() {
    const prev = { liked, likeCount };
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    startTransition(async () => {
      const result = await toggleLike(postId);
      if (result.error) {
        setLiked(prev.liked);
        setLikeCount(prev.likeCount);
        toast.error(result.error);
      }
    });
  }

  return (
    <LikeContext value={{ liked, likeCount, isPending, handleLike }}>
      {children}
    </LikeContext>
  );
}
