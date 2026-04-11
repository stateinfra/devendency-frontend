"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { registerUser } from "@/actions/auth";
import { toast } from "sonner";
import { Button, Input } from "@/components/ds";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (TURNSTILE_SITE_KEY && !token) {
      toast.error("보안 인증을 완료해주세요");
      return;
    }
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("turnstileToken", token);
    const result = await registerUser(formData);

    setLoading(false);
    turnstileRef.current?.reset();
    setToken("");

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("인증 코드가 이메일로 발송되었습니다.");
      router.push(`/verify?email=${encodeURIComponent(result.email || "")}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="username"
        name="username"
        label="사용자명"
        prefix="@"
        placeholder="menting"
        required
        minLength={3}
        maxLength={20}
        pattern="[a-zA-Z0-9_-]+"
      />
      <Input
        id="name"
        name="name"
        label="이름"
        placeholder="홍길동"
        required
      />
      <Input
        id="email"
        name="email"
        type="email"
        label="이메일"
        placeholder="you@example.com"
        required
      />
      <Input
        id="password"
        name="password"
        type="password"
        label="비밀번호"
        placeholder="6자 이상"
        required
        minLength={6}
      />
      {TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={setToken}
          onExpire={() => setToken("")}
          options={{ theme: "auto", size: "flexible" }}
        />
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        disabled={loading}
        className="w-full"
      >
        회원가입
      </Button>
    </form>
  );
}
