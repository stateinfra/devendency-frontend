import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeRaw from "rehype-raw";
import { MermaidDiagram } from "./mermaid-diagram";

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
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug]}
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
            return <pre {...props}>{children}</pre>;
          },
          img: ({ node, src, alt, ...props }: any) =>
            src ? <img src={src} alt={alt || ""} {...props} /> : null,
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
