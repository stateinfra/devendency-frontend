import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">회원가입</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          새 계정을 만들어 시작하세요
        </p>
      </div>

      <OAuthButtons />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-slate-500">또는</span>
        </div>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          로그인
        </Link>
      </p>
    </div>
  );
}
