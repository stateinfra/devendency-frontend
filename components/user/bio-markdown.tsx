import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function safeUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
  return "";
}

export function BioMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed break-words [&_p]:mb-2 last:[&_p]:mb-0 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_strong]:text-gray-700 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_code]:bg-black/[0.06] [&_code]:dark:bg-white/[0.08] [&_code]:px-1 [&_code]:rounded [&_code]:text-[0.875em]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeUrl}
        components={{
          a: ({ node, href, children, ...props }: any) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          // Disable block-level elements that don't belong in a bio
          h1: ({ children }: any) => <p className="font-bold">{children}</p>,
          h2: ({ children }: any) => <p className="font-bold">{children}</p>,
          h3: ({ children }: any) => <p className="font-bold">{children}</p>,
          h4: ({ children }: any) => <p className="font-bold">{children}</p>,
          img: () => null,
          pre: ({ children }: any) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
