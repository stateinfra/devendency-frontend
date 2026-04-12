/**
 * Build a short snippet around the first occurrence of any search term.
 * Strips markdown/HTML roughly for display.
 */
export function makeSnippet(content: string, terms: string[], maxLen = 160): string {
  if (!content) return "";
  // strip fenced code, images, links-url, HTML tags, markdown markers
  const cleaned = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lower = cleaned.toLowerCase();
  let idx = -1;
  let term = "";
  for (const t of terms) {
    const i = lower.indexOf(t.toLowerCase());
    if (i >= 0 && (idx === -1 || i < idx)) {
      idx = i;
      term = t;
    }
  }

  if (idx < 0) return cleaned.slice(0, maxLen) + (cleaned.length > maxLen ? "…" : "");

  const context = Math.max(0, Math.floor((maxLen - term.length) / 2));
  const start = Math.max(0, idx - context);
  const end = Math.min(cleaned.length, idx + term.length + context);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < cleaned.length ? "…" : "";
  return prefix + cleaned.slice(start, end) + suffix;
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function escapeLike(s: string): string {
  // Escape PostgreSQL ILIKE wildcards
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Split query into terms; keep quoted phrases intact. */
export function parseQueryTerms(q: string): string[] {
  const out: string[] = [];
  const re = /"([^"]+)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(q)) !== null) {
    const t = (m[1] || m[2] || "").trim();
    if (t) out.push(t);
  }
  return out;
}
