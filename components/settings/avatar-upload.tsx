"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { updateAvatar } from "@/actions/profile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type AvatarUploadProps = {
  currentImage: string | null;
  username: string;
};

export function AvatarUpload({ currentImage, username }: AvatarUploadProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 클라이언트 사이드 미리 검증
    if (file.size > 2 * 1024 * 1024) {
      toast.error("파일 크기는 2MB 이하여야 합니다");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다");
      return;
    }

    // 즉시 미리보기
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.set("avatar", file);

    startTransition(async () => {
      const result = await updateAvatar(formData);
      if (result.error) {
        toast.error(result.error);
        setPreview(currentImage); // 원복
      } else {
        toast.success("프로필 사진이 변경되었습니다");
        // JWT 세션 갱신 → 헤더 아바타에 즉시 반영
        await updateSession();
        router.refresh();
      }
      // 같은 파일 재선택 가능하도록 초기화
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="flex items-center gap-5">
      {/* 아바타 */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="relative group w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/[0.08] hover:ring-primary/50 transition-all disabled:opacity-60 shrink-0"
        aria-label="프로필 사진 변경"
      >
        {preview ? (
          <Image
            src={preview}
            alt="프로필 사진"
            fill
            sizes="80px"
            className="object-cover"
            unoptimized={preview.startsWith("blob:")}
          />
        ) : (
          <span className="flex items-center justify-center w-full h-full bg-primary/20 text-primary text-xl font-semibold">
            {initials}
          </span>
        )}

        {/* 호버 오버레이 */}
        <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          {isPending ? (
            <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
            </svg>
          ) : (
            <>
              <span className="material-symbols-outlined text-white text-[20px]">photo_camera</span>
              <span className="text-white text-[10px] mt-0.5">변경</span>
            </>
          )}
        </span>
      </button>

      {/* 안내 텍스트 */}
      <div className="flex flex-col gap-1">
        <p className="text-sm text-[#dcddde]/70">프로필 사진</p>
        <p className="text-xs text-[#dcddde]/40">JPG, PNG, WebP, GIF · 최대 2MB</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="mt-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50 text-left"
        >
          {isPending ? "업로드 중..." : "사진 변경"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
