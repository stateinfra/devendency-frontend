"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { checkEmailVerified } from "@/actions/auth";
import Link from "next/link";
import { Button, Input, Card } from "@/components/ds";

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
      <Input
        id="email"
        name="email"
        type="email"
        label="이메일"
        placeholder="you@example.com"
        required
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-xs font-semibold text-gray-500 dark:text-[#dcddde]/70">
            비밀번호
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••"
          required
        />
      </div>

      {unverifiedEmail && (
        <Card variant="alert" padding="sm">
          <p className="text-sm text-gray-500 dark:text-[#dcddde]/60 mb-2">이메일 인증이 완료되지 않았습니다.</p>
          <Link
            href={`/verify?email=${encodeURIComponent(unverifiedEmail)}`}
            className="text-sm text-primary hover:underline font-medium"
          >
            인증 페이지로 이동 →
          </Link>
        </Card>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        disabled={loading}
        className="w-full"
      >
        로그인
      </Button>
    </form>
  );
}
