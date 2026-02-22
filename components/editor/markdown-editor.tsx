"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostContent } from "@/components/post/post-content";
import { createPost, updatePost } from "@/actions/post";
import { toast } from "sonner";

type Category = { id: string; name: string };
type Tag = { id: string; name: string };

type MarkdownEditorProps = {
  postId?: string;
  initialData?: {
    title: string;
    content: string;
    excerpt: string;
    categoryId: string;
    tagIds: string[];
    published: boolean;
  };
  categories: Category[];
  tags: Tag[];
};

export function MarkdownEditor({
  postId,
  initialData,
  categories,
  tags,
}: MarkdownEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId || ""
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tagIds || []
  );

  function handleSubmit(published: boolean) {
    const formData = new FormData();
    formData.set("title", title);
    formData.set("content", content);
    formData.set("excerpt", excerpt);
    formData.set("categoryId", categoryId);
    selectedTags.forEach((tagId) => formData.append("tagIds", tagId));
    formData.set("published", String(published));

    startTransition(async () => {
      const result = postId
        ? await updatePost(postId, formData)
        : await createPost(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          published ? "글이 발행되었습니다" : "임시저장되었습니다"
        );
        router.push("/dashboard/posts");
        router.refresh();
      }
    });
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            placeholder="글 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>카테고리</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>태그</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                    selectedTags.includes(tag.id)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="excerpt">요약 (선택)</Label>
          <Input
            id="excerpt"
            placeholder="글 요약을 입력하세요 (비워두면 자동 생성)"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="write" className="w-full">
        <TabsList>
          <TabsTrigger value="write">작성</TabsTrigger>
          <TabsTrigger value="preview">미리보기</TabsTrigger>
        </TabsList>
        <TabsContent value="write">
          <Textarea
            placeholder="마크다운으로 글을 작성하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[500px] font-mono text-sm"
          />
        </TabsContent>
        <TabsContent value="preview">
          <div className="min-h-[500px] border rounded-md p-4">
            {content ? (
              <PostContent content={content} />
            ) : (
              <p className="text-muted-foreground">
                작성한 내용이 여기에 표시됩니다.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={isPending || !title || !content}
        >
          임시저장
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={isPending || !title || !content}
        >
          {isPending ? "저장 중..." : "발행하기"}
        </Button>
      </div>
    </div>
  );
}
