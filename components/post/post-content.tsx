import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import { MermaidDiagram } from "./mermaid-diagram";
import { CodeCopyButton } from "./code-copy-button";
import { ImageLightbox } from "./image-lightbox";

function safeUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
  return "";
}

function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/")) return u.pathname.slice(7).split("/")[0] || null;
      if (u.pathname.startsWith("/shorts/")) return u.pathname.slice(8).split("/")[0] || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function PostContent({
  content,
  knownSlugs = new Set(),
  slugTitles = new Map(),
}: {
  content: string;
  /** Set of existing post slugs for [[wiki-link]] resolution. */
  knownSlugs?: Set<string>;
  slugTitles?: Map<string, string>;
}) {
  const withWikiLinks = content.replace(
    /\[\[([^\[\]|\n]+?)(?:\|([^\]]+))?\]\]/g,
    (_m, rawSlug: string, label?: string) => {
      const slug = rawSlug.trim();
      const exists = knownSlugs.has(slug);
      const text = (label?.trim() || slugTitles.get(slug) || slug).trim();
      const url = `/posts/${encodeURIComponent(slug)}`;
      return exists
        ? `[${text}](${url})`
        : `[${text}](${url} "아직 작성되지 않은 글")`;
    },
  );
  const cleaned = withWikiLinks.replace(/!\[[^\]]*\]\(\s*\)/g, "");

  return (
    <div className="obsidian-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeSlug]}
        urlTransform={safeUrl}
        components={{
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-mermaid/.exec(className || "");
            if (match) {
              return (
                <MermaidDiagram
                  chart={String(children).replace(/\n$/, "")}
                />
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }: any) => {
            const child = children?.props;
            if (child?.className && /language-mermaid/.test(child.className)) {
              return <>{children}</>;
            }
            const code = String(child?.children ?? "").replace(/\n$/, "");
            return (
              <pre {...props} className={`${props.className ?? ""} group relative`}>
                {children}
                <CodeCopyButton code={code} />
              </pre>
            );
          },
          a: ({ node, href, children, ...props }: any) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          p: ({ node, children, ...props }: any) => {
            // Unwrap <p> when its sole non-whitespace child is an image
            const kids = (node?.children ?? []).filter(
              (c: any) => !(c.type === "text" && /^\s*$/.test(c.value)),
            );
            const onlyImage =
              kids.length === 1 && kids[0].type === "element" && kids[0].tagName === "img";
            if (onlyImage) return <>{children}</>;
            // Sole autolinked bare YouTube URL → embed as iframe.
            // Only triggers when the anchor's visible text matches the href —
            // that's the remark-gfm autolink shape. A markdown link
            // [label](url) has different text, so we leave it as a plain link.
            if (
              kids.length === 1 &&
              kids[0].type === "element" &&
              kids[0].tagName === "a"
            ) {
              const href = kids[0].properties?.href as string | undefined;
              const ytId = href ? parseYouTubeId(href) : null;
              if (ytId) {
                const anchorText = ((kids[0].children ?? []) as any[])
                  .filter((c) => c.type === "text")
                  .map((c) => c.value as string)
                  .join("");
                if (anchorText.trim() === href) {
                  return (
                    <div className="my-6 aspect-video w-full rounded-lg overflow-hidden bg-black/5 dark:bg-white/5">
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title="YouTube video player"
                        className="w-full h-full block"
                        style={{ margin: 0, borderRadius: 0, border: 0 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  );
                }
              }
            }
            return <p {...props}>{children}</p>;
          },
          img: ({ node, src, alt, ...props }: any) =>
            src ? <ImageLightbox src={src} alt={alt || ""} {...props} /> : null,
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
