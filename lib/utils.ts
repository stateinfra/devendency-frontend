import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "yyyy년 M월 d일", { locale: ko });
}

export function formatRelativeDate(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
}

export function generateExcerpt(content: string, maxLength = 200): string {
  const plainText = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")      // images
    .replace(/#{1,6}\s/g, "")                    // headings
    .replace(/\*\*|__/g, "")                     // bold
    .replace(/\*|_/g, "")                        // italic
    .replace(/`{3}[\s\S]*?`{3}/g, "")           // fenced code blocks
    .replace(/`[^`]+`/g, "")                     // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")    // links → text only
    .replace(/!\[.*$/gm, "")                     // broken image lines
    .replace(/https?:\/\/\S+/g, "")             // raw URLs
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return plainText.length > maxLength
    ? plainText.slice(0, maxLength) + "..."
    : plainText;
}
