/**
 * Extract [[slug]] wiki-links from markdown content.
 * Ignores occurrences inside fenced code blocks (``` ... ```).
 * Returns unique slugs.
 */
export function extractWikiLinks(content: string): string[] {
  // strip fenced code blocks
  const withoutFences = content.replace(/```[\s\S]*?```/g, "");
  // strip inline code
  const stripped = withoutFences.replace(/`[^`]*`/g, "");

  const found = new Set<string>();
  const re = /\[\[([^\[\]|\n]+?)(?:\|[^\]]+)?\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    const slug = m[1].trim();
    if (slug) found.add(slug);
  }
  return Array.from(found);
}

/**
 * Expand [[slug]] / [[slug|label]] into standard markdown links before
 * passing to ReactMarkdown. Unresolved slugs (no matching post) get a
 * `data-unresolved` class via an inline attribute note — rendered as
 * muted/italic in the theme.
 */
export function expandWikiLinks(
  content: string,
  resolver: (slug: string) => { exists: boolean; title?: string },
): string {
  return content.replace(
    /\[\[([^\[\]|\n]+?)(?:\|([^\]]+))?\]\]/g,
    (_match, rawSlug: string, label?: string) => {
      const slug = rawSlug.trim();
      const { exists, title } = resolver(slug);
      const text = (label?.trim() || title || slug).trim();
      return exists
        ? `[${text}](/posts/${encodeURIComponent(slug)})`
        : `[${text}](/posts/${encodeURIComponent(slug)} "아직 작성되지 않은 글")`;
    },
  );
}
