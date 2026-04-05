"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/profile";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/settings/avatar-upload";

type SettingsFormProps = {
  initialData: {
    username: string;
    name: string;
    bio: string;
    image: string | null;
  };
};

export function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState(initialData.username);
  const [name, setName] = useState(initialData.name);
  const [bio, setBio] = useState(initialData.bio);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    formData.set("username", username);
    formData.set("name", name);
    formData.set("bio", bio);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("프로필이 업데이트되었습니다");
        router.refresh();
      }
    });
  }

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-sm text-gray-900 dark:text-[#dcddde] placeholder:text-gray-400 dark:placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

  return (
    <div className="space-y-4">
      {/* 프로필 사진 카드 */}
      <div className="p-6 bg-card rounded-xl border border-black/[0.08] dark:border-white/[0.08]">
        <AvatarUpload
          currentImage={initialData.image}
          username={initialData.username || initialData.name || ""}
        />
      </div>

      {/* 프로필 정보 카드 */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-6 bg-card rounded-xl border border-black/[0.08] dark:border-white/[0.08]"
      >
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium text-gray-500 dark:text-[#dcddde]/70">
            사용자명
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 h-10 rounded-l-lg border border-r-0 border-black/[0.06] dark:border-white/[0.06] bg-black/[0.06] dark:bg-white/[0.06] text-sm text-gray-400 dark:text-[#dcddde]/40">
              @
            </span>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_-]+"
              className="w-full h-10 px-3 rounded-r-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-sm text-gray-900 dark:text-[#dcddde] placeholder:text-gray-400 dark:placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-500 dark:text-[#dcddde]/70">
            이름
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium text-gray-500 dark:text-[#dcddde]/70">
            소개
          </label>
          <textarea
            id="bio"
            placeholder="자기소개를 입력하세요"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-sm text-gray-900 dark:text-[#dcddde] placeholder:text-gray-400 dark:placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? "저장 중..." : "저장"}
        </button>
      </form>
    </div>
  );
}
