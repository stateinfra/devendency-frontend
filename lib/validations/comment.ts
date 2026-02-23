import { z } from "zod/v4";

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "댓글을 입력해주세요")
    .max(2000, "댓글은 2,000자 이하여야 합니다"),
  parentId: z.string().optional(),
});

export type CommentInput = z.infer<typeof commentSchema>;
