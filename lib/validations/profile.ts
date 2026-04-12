import { z } from "zod/v4";
import { usernameSchema } from "./auth";

const handleSchema = z
  .string()
  .max(50, "50자 이하여야 합니다")
  .regex(/^[A-Za-z0-9._-]+$/, "영문·숫자·._- 만 사용 가능합니다")
  .optional();

export const profileSchema = z.object({
  username: usernameSchema,
  name: z
    .string()
    .min(1, "이름을 입력해주세요")
    .max(50, "이름은 50자 이하여야 합니다"),
  bio: z
    .string()
    .max(500, "소개는 500자 이하여야 합니다")
    .optional(),
  github: handleSchema,
  linkedin: handleSchema,
  twitter: handleSchema,
  instagram: handleSchema,
});

export type ProfileInput = z.infer<typeof profileSchema>;
