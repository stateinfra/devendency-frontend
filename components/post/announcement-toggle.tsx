"use client";

import { useState, useTransition } from "react";
import { toggleAnnouncement } from "@/actions/admin";
import { toast } from "sonner";

export function AnnouncementToggle({
  postId,
  initialIsAnnouncement,
}: {
  postId: string;
  initialIsAnnouncement: boolean;
}) {
  const [isAnnouncement, setIsAnnouncement] = useState(initialIsAnnouncement);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleAnnouncement(postId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsAnnouncement(!!result.isAnnouncement);
        toast.success(result.isAnnouncement ? "공지로 등록되었습니다" : "공지가 해제되었습니다");
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-all leading-none box-border ${
        isAnnouncement
          ? "text-amber-500 border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20"
          : "border-transparent text-slate-400 hover:text-amber-500 hover:bg-amber-500/10"
      } ${isPending ? "opacity-50" : ""}`}
      title={isAnnouncement ? "공지 해제" : "공지로 등록"}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18, width: 18, height: 18, lineHeight: "18px", fontVariationSettings: isAnnouncement ? "'FILL' 1" : undefined }}
      >
        campaign
      </span>
    </button>
  );
}
