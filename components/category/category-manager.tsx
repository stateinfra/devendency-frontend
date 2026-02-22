"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory } from "@/actions/category";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { posts: number };
};

export function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);

    startTransition(async () => {
      const result = await createCategory(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("카테고리가 생성되었습니다");
        setName("");
        setDescription("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
        <div>
          <Label htmlFor="name">카테고리 이름</Label>
          <Input
            id="name"
            placeholder="예: 프론트엔드"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="description">설명 (선택)</Label>
          <Input
            id="description"
            placeholder="카테고리 설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isPending || !name.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          추가
        </Button>
      </form>

      <div className="border rounded-lg divide-y">
        {categories.length === 0 ? (
          <p className="p-4 text-muted-foreground text-center">
            카테고리가 없습니다.
          </p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{cat.name}</p>
                {cat.description && (
                  <p className="text-sm text-muted-foreground">
                    {cat.description}
                  </p>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {cat._count.posts}개의 글
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
