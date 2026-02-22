import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";

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
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        urlTransform={safeUrl}
        components={{
          img: ({ node, src, alt, ...props }: any) =>
            src ? <img src={src} alt={alt || ""} {...props} /> : null,
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
