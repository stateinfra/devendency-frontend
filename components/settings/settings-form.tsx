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

          <Textarea
            label="소개"
            placeholder="자기소개를 입력하세요"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
          />

          <Button type="submit" loading={isPending} size="lg">
            {isPending ? "저장 중..." : "저장"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
