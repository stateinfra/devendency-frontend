import { z } from "zod/v4";

const BLOCKED_SUFFIXES = [".vercel.app", ".devendency.com"];

const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export const domainSchema = z
  .string()
  .min(1, "도메인을 입력해주세요")
  .max(253, "도메인은 253자 이하여야 합니다")
  .transform((v) => v.toLowerCase().trim())
  .check(
    z.refine((v) => DOMAIN_REGEX.test(v), "올바른 도메인 형식이 아닙니다"),
    z.refine(
      (v) => !BLOCKED_SUFFIXES.some((s) => v.endsWith(s)),
      "이 도메인은 사용할 수 없습니다",
    ),
  );

export type DomainInput = z.infer<typeof domainSchema>;
