"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { getFollowList, type FollowUser } from "@/actions/follow";
import { FollowButton } from "@/components/user/follow-button";
import { useSession } from "next-auth/react";

type FollowListModalProps = {
  userId: string;
  type: "followers" | "following";
  count: number;
  onClose: () => void;
};

export function FollowListModal({ userId, type, count, onClose }: FollowListModalProps) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [isPending, startTransition] = useTransition();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startTransition(async () => {
      const list = await getFollowList(userId, type);
      setUsers(list);
    });
  }, [userId, type]);

  // ESC로 닫기
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const title = type === "followers" ? "팔로워" : "팔로잉";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-sm bg-[#1e1e1e] rounded-2xl border border-white/[0.08] shadow-2xl flex flex-col max-h-[70vh]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] shrink-0">
          <h2 className="text-base font-semibold text-white">
            {title} <span className="text-[#dcddde]/40 font-normal text-sm ml-1">{count}</span>
          </h2>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full hover:bg-white/10 text-[#dcddde]/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* 목록 */}
        <div className="overflow-y-auto flex-1">
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
              </svg>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-[#dcddde]/40 text-sm py-12">
              {type === "followers" ? "아직 팔로워가 없습니다" : "아직 팔로잉하는 사람이 없습니다"}
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {users.map((user) => (
                <li key={user.id} className="flex items-center gap-3 px-5 py-3">
                  <Link
                    href={`/users/@${user.username}`}
                    onClick={onClose}
                    className="shrink-0"
                  >
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || ""}
                        width={40}
                        height={40}
                        className="rounded-full object-cover size-10"
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                        {user.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </Link>
                  <Link
                    href={`/users/@${user.username}`}
                    onClick={onClose}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-[#dcddde]/40 truncate">@{user.username}</p>
                  </Link>
                  {/* 자신이 아니고 로그인된 경우 팔로우 버튼 */}
                  {session?.user && session.user.id !== user.id && (
                    <FollowButton
                      targetUserId={user.id}
                      initialFollowing={false}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
