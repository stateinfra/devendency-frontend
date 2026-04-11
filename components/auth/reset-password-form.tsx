"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/actions/auth";
import { toast } from "sonner";
import { Button, Input } from "@/components/ds";

export function ResetPasswordForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }

    setLoading(true);
    const result = await resetPassword(token, email, password);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("비밀번호가 변경되었습니다");
      router.push("/login");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="새 비밀번호"
        name="password"
        type="password"
        placeholder="6자 이상"
        required
        minLength={6}
      />
      <Input
        label="비밀번호 확인"
        name="confirm"
        type="password"
        placeholder="비밀번호 재입력"
        required
        minLength={6}
      />
      <Button
        type="submit"
        className="w-full"
        disabled={loading}
        loading={loading}
      >
        {loading ? "변경 중..." : "비밀번호 변경"}
      </Button>
    </form>
  );
}
