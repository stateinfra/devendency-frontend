"use client";

import { useState } from "react";
import { FollowListModal } from "@/components/user/follow-list-modal";

type FollowStatsProps = {
  userId: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  totalLikes: number;
};

type ModalType = "followers" | "following" | null;

export function FollowStats({
  userId,
  postCount,
  followerCount,
  followingCount,
  totalLikes,
}: FollowStatsProps) {
  const [modal, setModal] = useState<ModalType>(null);

  const statClass =
    "flex gap-1.5 items-center cursor-pointer hover:opacity-70 transition-opacity select-none";

  return (
    <>
      <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
        <div className="flex gap-1.5 items-center">
          <span className="font-bold text-white">{postCount}</span>
          <span className="text-slate-500">포스트</span>
        </div>
        <button className={statClass} onClick={() => setModal("followers")}>
          <span className="font-bold text-white">{followerCount}</span>
          <span className="text-slate-500">팔로워</span>
        </button>
        <button className={statClass} onClick={() => setModal("following")}>
          <span className="font-bold text-white">{followingCount}</span>
          <span className="text-slate-500">팔로잉</span>
        </button>
        <div className="flex gap-1.5 items-center">
          <span className="font-bold text-white">{totalLikes}</span>
          <span className="text-slate-500">좋아요</span>
        </div>
      </div>

      {modal && (
        <FollowListModal
          userId={userId}
          type={modal}
          count={modal === "followers" ? followerCount : followingCount}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
