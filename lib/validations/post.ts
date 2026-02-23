import { z } from "zod/v4";

export const postSchema = z.object({
  title: z
    .string()
    .min(1, "제목을 입력해주세요")
    .max(100, "제목은 100자 이하여야 합니다"),
  content: z
    .string()
    .min(1, "내용을 입력해주세요")
    .max(50000, "본문은 50,000자 이하여야 합니다"),
  excerpt: z
    .string()
    .max(300, "요약은 300자 이하여야 합니다")
    .optional(),
  tagNames: z
    .array(z.string().max(30, "태그는 30자 이하여야 합니다"))
    .max(10, "태그는 최대 10개까지 가능합니다")
    .optional(),
  published: z.boolean().optional(),
  coverImage: z
    .string()
    .max(500, "이미지 URL이 너무 깁니다")
    .optional(),
});

export type PostInput = z.infer<typeof postSchema>;
