import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeRaw from "rehype-raw";
import { MermaidDiagram } from "./mermaid-diagram";
import { CodeCopyButton } from "./code-copy-button";
import { ImageLightbox } from "./image-lightbox";

function safeUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
  return "";
}

export function PostContent({ content }: { content: string }) {
  const cleaned = content.replace(/!\[[^\]]*\]\(\s*\)/g, "");

  return (
    <div className="obsidian-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHighlight, rehypeSlug]}
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
          img: ({ node, src, alt, ...props }: any) =>
            src ? <ImageLightbox src={src} alt={alt || ""} {...props} /> : null,
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
