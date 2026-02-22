"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerUser } from "@/actions/auth";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("회원가입이 완료되었습니다. 로그인해주세요.");
      router.push("/login");
    }
  }

  const inputClass = "w-full h-10 px-3 rounded-lg border border-white/[0.06] bg-white/[0.04] text-sm text-[#dcddde] placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-[#dcddde]/70">
          사용자명
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 h-10 rounded-l-lg border border-r-0 border-white/[0.06] bg-white/[0.06] text-sm text-[#dcddde]/40">
            @
          </span>
          <input
            id="username"
            name="username"
            placeholder="menting"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_-]+"
            className="w-full h-10 px-3 rounded-r-lg border border-white/[0.06] bg-white/[0.04] text-sm text-[#dcddde] placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-[#dcddde]/70">
          이름
        </label>
        <input
          id="name"
          name="name"
          placeholder="홍길동"
          required
          className={inputClass}
        />
      </div>
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
          className={inputClass}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-[#dcddde]/70">
          비밀번호
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
      <button
        type="submit"
        className="w-full h-10 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "가입 중..." : "회원가입"}
      </button>
    </form>
  );
}
