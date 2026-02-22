"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyEmail, resendVerificationCode } from "@/actions/auth";
import { toast } from "sonner";

export function VerifyForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isPending, startTransition] = useTransition();
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newCode.every((c) => c) && value) {
      handleSubmit(newCode.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleSubmit(pasted);
    }
  }

  function handleSubmit(codeStr: string) {
    startTransition(async () => {
      const result = await verifyEmail(email, codeStr);
      if (result.error) {
        toast.error(result.error);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        toast.success("이메일 인증이 완료되었습니다");
        router.push("/login");
      }
    });
  }

  function handleResend() {
    if (cooldown > 0) return;

    startTransition(async () => {
      const result = await resendVerificationCode(email);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("인증 코드가 재발송되었습니다");
        setCooldown(60);
        const interval = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-2">
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className="size-12 text-center text-lg font-bold rounded-lg border border-white/[0.06] bg-white/[0.04] text-[#dcddde] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            disabled={isPending}
          />
        ))}
      </div>

      <button
        onClick={() => handleSubmit(code.join(""))}
        disabled={isPending || code.some((c) => !c)}
        className="w-full h-10 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "확인 중..." : "인증하기"}
      </button>

      <div className="text-center">
        <button
          onClick={handleResend}
          disabled={isPending || cooldown > 0}
          className="text-sm text-[#dcddde]/40 hover:text-primary transition-colors disabled:cursor-not-allowed"
        >
          {cooldown > 0
            ? `재발송 (${cooldown}초)`
            : "인증 코드 재발송"}
        </button>
      </div>
    </div>
  );
}
