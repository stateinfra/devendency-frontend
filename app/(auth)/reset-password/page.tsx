import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import Link from "next/link";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-gray-500 dark:text-[#dcddde]/60 mb-4">유효하지 않은 링크입니다.</p>
          <Link href="/login" className="text-primary hover:underline text-sm">
            로그인으로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">비밀번호 변경</h1>
          <p className="text-sm text-gray-500 dark:text-[#dcddde]/50 mt-2">
            새 비밀번호를 입력해주세요.
          </p>
        </div>
        <ResetPasswordForm token={token} email={email} />
      </div>
    </div>
  );
}
