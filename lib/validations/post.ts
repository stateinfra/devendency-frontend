import { z } from "zod/v4";

export const postSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  content: z.string().min(1, "내용을 입력해주세요"),
  excerpt: z.string().optional(),
  tagNames: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  coverImage: z.string().optional(),
});

export type PostInput = z.infer<typeof postSchema>;
