"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  registerCustomDomain,
  verifyCustomDomain,
  removeCustomDomain,
  updateCustomLogo,
} from "@/actions/domain";
import { toast } from "sonner";

type CustomDomainSectionProps = {
  currentDomain: string | null;
  domainVerified: boolean;
  customLogo: string | null;
};

export function CustomDomainSection({
  currentDomain,
  domainVerified,
  customLogo,
}: CustomDomainSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [domain, setDomain] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    formData.set("domain", domain);

    startTransition(async () => {
      const result = await registerCustomDomain(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("도메인이 등록되었습니다. DNS 설정 후 인증해주세요.");
        setDomain("");
        router.refresh();
      }
    });
  }

  function handleVerify() {
    startTransition(async () => {
      const result = await verifyCustomDomain();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("도메인 인증이 완료되었습니다!");
        router.refresh();
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeCustomDomain();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("도메인이 제거되었습니다.");
        router.refresh();
      }
    });
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("logo", file);

    startTransition(async () => {
      const result = await updateCustomLogo(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("로고가 업데이트되었습니다.");
        router.refresh();
      }
    });

    // input 초기화
    e.target.value = "";
  }

  // 인증 완료 상태
  if (currentDomain && domainVerified) {
    return (
      <div className="p-6 bg-card rounded-xl border border-white/[0.08]">
        <h2 className="text-lg font-semibold mb-2">커스텀 도메인</h2>
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            연결됨
          </span>
          <span className="text-sm text-[#dcddde]">{currentDomain}</span>
        </div>

        {/* 로고 설정 */}
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] mb-4">
          <p className="text-sm text-[#dcddde]/80 mb-3">
            커스텀 도메인 헤더에 표시할 로고
          </p>
          <div className="flex items-center gap-3">
            {customLogo ? (
              <Image
                src={customLogo}
                alt="Custom logo"
                width={40}
                height={40}
                className="size-10 rounded object-contain border border-white/[0.06]"
              />
            ) : (
              <div className="size-10 rounded border border-dashed border-white/[0.12] flex items-center justify-center text-[#dcddde]/30">
                <span className="material-symbols-outlined text-[20px]">image</span>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoChange}
              className="hidden"
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={isPending}
              className="h-9 px-4 rounded-lg border border-white/[0.06] text-sm text-[#dcddde]/70 hover:bg-white/[0.04] transition-colors disabled:opacity-50"
            >
              {isPending ? "업로드 중..." : customLogo ? "로고 변경" : "로고 업로드"}
            </button>
          </div>
        </div>

        <button
          onClick={handleRemove}
          disabled={isPending}
          className="h-10 px-6 rounded-lg border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/5 transition-colors disabled:opacity-50"
        >
          {isPending ? "처리 중..." : "도메인 제거"}
        </button>
      </div>
    );
  }

  // 등록됨 + 인증 대기 상태
  if (currentDomain && !domainVerified) {
    return (
      <div className="p-6 bg-card rounded-xl border border-white/[0.08]">
        <h2 className="text-lg font-semibold mb-2">커스텀 도메인</h2>
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            인증 대기
          </span>
          <span className="text-sm text-[#dcddde]">{currentDomain}</span>
        </div>

        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] mb-4">
          <p className="text-sm text-[#dcddde]/80 mb-2">
            DNS 설정에서 아래 CNAME 레코드를 추가해주세요:
          </p>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <span className="text-[#dcddde]/50">타입</span>
            <span className="text-[#dcddde] font-mono">CNAME</span>
            <span className="text-[#dcddde]/50">이름</span>
            <span className="text-[#dcddde] font-mono">{currentDomain}</span>
            <span className="text-[#dcddde]/50">값</span>
            <span className="text-[#dcddde] font-mono">cname.vercel-dns.com</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleVerify}
            disabled={isPending}
            className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? "확인 중..." : "DNS 인증"}
          </button>
          <button
            onClick={handleRemove}
            disabled={isPending}
            className="h-10 px-6 rounded-lg border border-white/[0.06] text-[#dcddde]/70 text-sm font-medium hover:bg-white/[0.04] transition-colors disabled:opacity-50"
          >
            {isPending ? "처리 중..." : "도메인 제거"}
          </button>
        </div>
      </div>
    );
  }

  // 미등록 상태
  return (
    <div className="p-6 bg-card rounded-xl border border-white/[0.08]">
      <h2 className="text-lg font-semibold mb-2">커스텀 도메인</h2>
      <p className="text-sm text-[#dcddde]/60 mb-4">
        자신의 도메인을 연결하면 해당 도메인으로 프로필 페이지에 접근할 수 있습니다.
      </p>
      <form onSubmit={handleRegister} className="flex gap-2">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          required
          className="flex-1 h-10 px-3 rounded-lg border border-white/[0.06] bg-white/[0.04] text-sm text-[#dcddde] placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
        <button
          type="submit"
          disabled={isPending || !domain}
          className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? "처리 중..." : "등록"}
        </button>
      </form>
    </div>
  );
}
