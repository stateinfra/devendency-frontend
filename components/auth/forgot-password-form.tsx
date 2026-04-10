"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/actions/auth";
import Link from "next/link";
import { Button, Input, Card } from "@/components/ds";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordReset(formData);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <Card variant="alert" padding="md">
          <p className="text-sm text-gray-600 dark:text-[#dcddde]/80">
            입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다.
          </p>
          <p className="text-sm text-gray-500 dark:text-[#dcddde]/50 mt-2">
            이메일이 도착하지 않는다면 스팸함을 확인해주세요.
          </p>
        </Card>
        <Link
          href="/login"
          className="text-sm text-primary hover:underline font-medium"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="email"
        name="email"
        type="email"
        label="이메일"
        placeholder="you@example.com"
        required
      />

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        disabled={loading}
        className="w-full"
      >
        비밀번호 재설정 링크 받기
      </Button>

      <p className="text-center text-sm text-gray-500 dark:text-[#dcddde]/50">
        <Link href="/login" className="text-primary hover:underline font-medium">
          로그인으로 돌아가기
        </Link>
      </p>
    </form>
  );
}
