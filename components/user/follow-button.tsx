"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/actions/follow";
import { toast } from "sonner";

type FollowButtonProps = {
  targetUserId: string;
  initialFollowing: boolean;
};

export function FollowButton({
  targetUserId,
  initialFollowing,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setFollowing(!following);
    startTransition(async () => {
      const result = await toggleFollow(targetUserId);
      if (result.error) {
        setFollowing(following);
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`h-9 px-5 rounded-full text-sm font-medium transition-colors ${
        following
          ? "bg-white/10 text-slate-300 hover:bg-red-900/20 hover:text-red-400 border border-white/10"
          : "bg-primary text-white hover:bg-primary/80"
      }`}
    >
      {following ? "팔로잉" : "팔로우"}
    </button>
  );
}
