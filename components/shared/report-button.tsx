"use client";

import { useState, useTransition } from "react";
import { createReport } from "@/actions/report";
import { toast } from "sonner";
import { Button, Input, Modal } from "@/components/ds";

type ReportButtonProps = {
  type: "POST" | "COMMENT";
  targetId: string;
};

export function ReportButton({ type, targetId }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;

    startTransition(async () => {
      const result = await createReport(type, targetId, reason);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("신고가 접수되었습니다");
        setOpen(false);
        setReason("");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-transparent text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all leading-none box-border"
        title="신고"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, width: 18, height: 18, lineHeight: "18px" }}
        >
          flag
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="신고하기">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-[#dcddde]/50">
            {type === "POST" ? "이 글" : "이 댓글"}을 신고하는 이유를 입력해주세요.
          </p>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="스팸, 욕설, 부적절한 콘텐츠 등"
            required
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button variant="danger" type="submit" loading={isPending} disabled={!reason.trim()}>
              신고
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
