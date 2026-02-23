import { z } from "zod/v4";
import { usernameSchema } from "./auth";

export const profileSchema = z.object({
  username: usernameSchema,
  name: z
    .string()
    .min(1, "이름을 입력해주세요")
    .max(50, "이름은 50자 이하여야 합니다"),
  bio: z
    .string()
    .max(200, "소개는 200자 이하여야 합니다")
    .optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
