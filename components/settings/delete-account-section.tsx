"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestAccountDeletion, cancelAccountDeletion } from "@/actions/account";
import { toast } from "sonner";

type DeleteAccountSectionProps = {
  deletionScheduledAt: string | null;
  hasPassword: boolean;
};

export function DeleteAccountSection({ deletionScheduledAt, hasPassword }: DeleteAccountSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");

  function handleRequestDeletion(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    formData.set("password", password);

    startTransition(async () => {
      const result = await requestAccountDeletion(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("회원 탈퇴가 예약되었습니다. 30일 후 계정이 영구 삭제됩니다.");
        router.push("/login");
      }
    });
  }

  function handleCancelDeletion() {
    startTransition(async () => {
      const result = await cancelAccountDeletion();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("탈퇴가 취소되었습니다.");
        router.refresh();
      }
    });
  }

  if (deletionScheduledAt) {
    const scheduledDate = new Date(deletionScheduledAt);
    const formattedDate = scheduledDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <div className="p-6 bg-card rounded-xl border border-red-500/20">
        <h2 className="text-lg font-semibold text-red-400 mb-2">탈퇴 예정 계정</h2>
        <p className="text-sm text-gray-500 dark:text-[#dcddde]/60 mb-4">
          이 계정은 <span className="text-red-400 font-medium">{formattedDate}</span>에 영구 삭제될 예정입니다.
          탈퇴를 취소하면 계정이 정상적으로 복구됩니다.
        </p>
        <button
          onClick={handleCancelDeletion}
          disabled={isPending}
          className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? "처리 중..." : "탈퇴 취소"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card rounded-xl border border-black/[0.08] dark:border-white/[0.08]">
      <h2 className="text-lg font-semibold text-red-400 mb-2">회원 탈퇴</h2>
      <p className="text-sm text-gray-500 dark:text-[#dcddde]/60 mb-4">
        탈퇴를 요청하면 30일의 유예 기간 후 계정과 모든 데이터가 영구 삭제됩니다.
        유예 기간 내에 다시 로그인하면 탈퇴를 취소할 수 있습니다.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="h-10 px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
        >
          회원 탈퇴
        </button>
      ) : (
        <form onSubmit={handleRequestDeletion} className="space-y-3">
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
            <p className="text-sm text-red-400 mb-3">
              정말 탈퇴하시겠습니까? 확인을 위해 비밀번호를 입력해주세요.
            </p>
            {hasPassword ? (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
                className="w-full h-10 px-3 rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-sm text-gray-900 dark:text-[#dcddde] placeholder:text-gray-400 dark:placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
              />
            ) : (
              <p className="text-sm text-gray-500 dark:text-[#dcddde]/50">
                소셜 로그인 계정은 비밀번호 확인이 불가합니다. 관리자에게 문의해주세요.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                setPassword("");
              }}
              className="h-10 px-4 rounded-lg border border-black/[0.06] dark:border-white/[0.06] text-sm text-gray-500 dark:text-[#dcddde]/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
            >
              취소
            </button>
            {hasPassword && (
              <button
                type="submit"
                disabled={isPending || !password}
                className="h-10 px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isPending ? "처리 중..." : "탈퇴 확인"}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
