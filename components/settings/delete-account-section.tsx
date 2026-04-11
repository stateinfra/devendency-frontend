"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestAccountDeletion, cancelAccountDeletion } from "@/actions/account";
import { toast } from "sonner";
import { Button, Input } from "@/components/ds";

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
        <Button
          onClick={handleCancelDeletion}
          disabled={isPending}
          loading={isPending}
        >
          {isPending ? "처리 중..." : "탈퇴 취소"}
        </Button>
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
        <Button variant="danger" onClick={() => setShowConfirm(true)}>
          회원 탈퇴
        </Button>
      ) : (
        <form onSubmit={handleRequestDeletion} className="space-y-3">
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
            <p className="text-sm text-red-400 mb-3">
              정말 탈퇴하시겠습니까? 확인을 위해 비밀번호를 입력해주세요.
            </p>
            {hasPassword ? (
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
              />
            ) : (
              <p className="text-sm text-gray-500 dark:text-[#dcddde]/50">
                소셜 로그인 계정은 비밀번호 확인이 불가합니다. 관리자에게 문의해주세요.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowConfirm(false);
                setPassword("");
              }}
            >
              취소
            </Button>
            {hasPassword && (
              <Button
                type="submit"
                variant="danger"
                disabled={isPending || !password}
                loading={isPending}
              >
                {isPending ? "처리 중..." : "탈퇴 확인"}
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
