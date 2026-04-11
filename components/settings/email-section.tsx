"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateEmail, resendEmailVerification, verifyEmailFromSettings } from "@/actions/profile";
import { toast } from "sonner";
import { Button, Input, Card, Badge } from "@/components/ds";

type EmailSectionProps = {
  email: string;
  emailVerified: boolean;
};

export function EmailSection({ email, emailVerified }: EmailSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(email);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;

    startTransition(async () => {
      const result = await updateEmail(new FormData(e.target as HTMLFormElement));
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("인증 코드가 발송되었습니다. 이메일을 확인해주세요.");
        setEditing(false);
        setVerifying(true);
        router.refresh();
      }
    });
  }

  function handleResend() {
    startTransition(async () => {
      const result = await resendEmailVerification();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("인증 코드가 재발송되었습니다");
        setVerifying(true);
      }
    });
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    startTransition(async () => {
      const result = await verifyEmailFromSettings(code.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("이메일이 인증되었습니다");
        setVerifying(false);
        setCode("");
        router.refresh();
      }
    });
  }

  return (
    <Card variant="settings" padding="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#dcddde]">이메일</h3>
          {emailVerified ? (
            <Badge variant="success">인증됨</Badge>
          ) : (
            <Badge variant="warning">미인증</Badge>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleChangeEmail} className="space-y-3">
            <Input
              name="email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="새 이메일 주소"
              required
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={isPending}>
                변경
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setEditing(false); setNewEmail(email); }}
              >
                취소
              </Button>
            </div>
          </form>
        ) : verifying ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-[#dcddde]/50">
              <span className="font-medium text-gray-700 dark:text-[#dcddde]/70">{email}</span>으로 발송된 인증 코드를 입력해주세요.
            </p>
            <form onSubmit={handleVerify} className="flex items-end gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="인증 코드 6자리"
                maxLength={6}
                className="w-40"
              />
              <Button type="submit" size="sm" loading={isPending}>
                인증
              </Button>
            </form>
            <button
              type="button"
              onClick={handleResend}
              disabled={isPending}
              className="text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              코드 재발송
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-[#dcddde]/50">{email}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                이메일 변경
              </Button>
              {!emailVerified && (
                <Button variant="secondary" size="sm" onClick={handleResend} loading={isPending}>
                  인증 메일 발송
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
