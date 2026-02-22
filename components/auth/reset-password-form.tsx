"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/actions/auth";
import { toast } from "sonner";

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

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-white/[0.06] bg-white/[0.04] text-sm text-[#dcddde] placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-[#dcddde]/70"
        >
          새 비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="6자 이상"
          required
          minLength={6}
          className={inputClass}
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="confirm"
          className="text-sm font-medium text-[#dcddde]/70"
        >
          비밀번호 확인
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          placeholder="비밀번호 재입력"
          required
          minLength={6}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        className="w-full h-10 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
