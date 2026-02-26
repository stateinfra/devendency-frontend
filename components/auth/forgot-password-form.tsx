"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/actions/auth";
import Link from "next/link";

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
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-sm text-[#dcddde]/80">
            입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다.
          </p>
          <p className="text-sm text-[#dcddde]/50 mt-2">
            이메일이 도착하지 않는다면 스팸함을 확인해주세요.
          </p>
        </div>
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
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-[#dcddde]/70">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          className="w-full h-10 px-3 rounded-lg border border-white/[0.06] bg-white/[0.04] text-sm text-[#dcddde] placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        className="w-full h-10 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "발송 중..." : "비밀번호 재설정 링크 받기"}
      </button>

      <p className="text-center text-sm text-[#dcddde]/50">
        <Link href="/login" className="text-primary hover:underline font-medium">
          로그인으로 돌아가기
        </Link>
      </p>
    </form>
  );
}
