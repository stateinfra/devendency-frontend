"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/actions/post";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/shared/confirm-modal";

export function DeletePostButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deletePost(postId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("글이 삭제되었습니다");
        router.push("/");
        router.refresh();
      }
      setShowModal(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="size-9 flex items-center justify-center rounded-lg hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">delete</span>
      </button>
      <ConfirmModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        title="글을 삭제하시겠습니까?"
        description="삭제된 글은 복구할 수 없습니다."
        loading={isPending}
      />
    </>
  );
}
