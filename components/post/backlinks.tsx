import Link from "next/link";

type Backlink = { slug: string; title: string };

export function Backlinks({ items }: { items: Backlink[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-12 border-t border-black/[0.06] dark:border-white/[0.06] pt-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">link</span>
        이 글을 언급한 글 ({items.length})
      </h3>
      <ul className="space-y-1.5">
        {items.map((b) => (
          <li key={b.slug}>
            <Link
              href={`/posts/${b.slug}`}
              className="text-sm text-gray-700 dark:text-slate-300 hover:text-primary transition-colors"
            >
              {b.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
