"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { checkEmailVerified } from "@/actions/auth";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setUnverifiedEmail(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    // Check email verification status first
    const check = await checkEmailVerified(email);
    if (check.status === "unverified") {
      setLoading(false);
      setUnverifiedEmail(email);
      toast.error("이메일 인증이 필요합니다");
      return;
    }

    const result = await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast.error("이메일 또는 비밀번호가 올바르지 않습니다");
    } else {
      router.push("/");
      router.refresh();
    }
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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-[#dcddde]/70">
            비밀번호
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••"
          required
          className="w-full h-10 px-3 rounded-lg border border-white/[0.06] bg-white/[0.04] text-sm text-[#dcddde] placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {unverifiedEmail && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-sm text-[#dcddde]/60 mb-2">이메일 인증이 완료되지 않았습니다.</p>
          <Link
            href={`/verify?email=${encodeURIComponent(unverifiedEmail)}`}
            className="text-sm text-primary hover:underline font-medium"
          >
            인증 페이지로 이동 →
          </Link>
        </div>
      )}

      <button
        type="submit"
        className="w-full h-10 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
