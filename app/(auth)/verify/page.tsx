import { VerifyForm } from "@/components/auth/verify-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이메일 인증",
};

type Props = {
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[24px]">mail</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#dcddde]">이메일 인증</h1>
        <p className="text-sm text-gray-400 dark:text-[#dcddde]/40">
          {email ? (
            <>
              <span className="text-gray-500 dark:text-[#dcddde]/70">{email}</span>
              <span>으로 발송된 인증 코드를 입력해주세요.</span>
            </>
          ) : (
            "인증 코드를 입력해주세요."
          )}
        </p>
      </div>

      <VerifyForm email={email || ""} />
    </div>
  );
}
