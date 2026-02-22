import { z } from "zod/v4";

export const usernameSchema = z
  .string()
  .min(3, "사용자명은 3자 이상이어야 합니다")
  .max(20, "사용자명은 20자 이하여야 합니다")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "사용자명은 영문, 숫자, 하이픈, 언더스코어만 사용 가능합니다"
  );

export const loginSchema = z.object({
  email: z.email("유효한 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

export const registerSchema = z.object({
  username: usernameSchema,
  name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
  email: z.email("유효한 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
