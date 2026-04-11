"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/actions/follow";
import { toast } from "sonner";
import { Button } from "@/components/ds";

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
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant={following ? "outline" : "primary"}
      pill
      size="sm"
      className={following ? "hover:bg-red-900/20 hover:text-red-400 hover:border-red-500/20" : ""}
    >
      {following ? "팔로잉" : "팔로우"}
    </Button>
  );
}
