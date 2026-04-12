"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/profile";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { Button, Input, Textarea, Card } from "@/components/ds";

type SettingsFormProps = {
  initialData: {
    username: string;
    name: string;
    bio: string;
    image: string | null;
    github: string;
    linkedin: string;
    twitter: string;
    instagram: string;
  };
};

export function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState(initialData.username);
  const [name, setName] = useState(initialData.name);
  const [bio, setBio] = useState(initialData.bio);
  const [github, setGithub] = useState(initialData.github);
  const [linkedin, setLinkedin] = useState(initialData.linkedin);
  const [twitter, setTwitter] = useState(initialData.twitter);
  const [instagram, setInstagram] = useState(initialData.instagram);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    formData.set("username", username);
    formData.set("name", name);
    formData.set("bio", bio);
    formData.set("github", github);
    formData.set("linkedin", linkedin);
    formData.set("twitter", twitter);
    formData.set("instagram", instagram);

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

  return (
    <div className="space-y-4">
      {/* 프로필 사진 카드 */}
      <Card variant="settings" padding="lg">
        <AvatarUpload
          currentImage={initialData.image}
          username={initialData.username || initialData.name || ""}
        />
      </Card>

      {/* 프로필 정보 카드 */}
      <Card variant="settings" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="사용자명"
            prefix="@"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_-]+"
          />

          <Input
            label="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div>
            <Textarea
              label="소개"
              placeholder="자기소개를 입력하세요 (마크다운 지원)"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              rows={5}
              maxLength={500}
            />
            <div className="text-[11px] text-slate-500 text-right mt-1">
              {bio.length} / 500
            </div>
          </div>

          <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
              소셜 링크
            </h3>
            <div className="space-y-3">
              <Input
                label="GitHub"
                prefix="github.com/"
                placeholder="username"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
              <Input
                label="LinkedIn"
                prefix="linkedin.com/in/"
                placeholder="username"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
              <Input
                label="X (Twitter)"
                prefix="x.com/"
                placeholder="username"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
              />
              <Input
                label="Instagram"
                prefix="instagram.com/"
                placeholder="username"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" loading={isPending} size="lg">
            {isPending ? "저장 중..." : "저장"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
