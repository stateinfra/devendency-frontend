"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, generateExcerpt } from "@/lib/utils";
import type { PostWithRelations } from "@/types";

export function PostCard({ post }: { post: PostWithRelations }) {
  const router = useRouter();

  return (
    <Link href={`/posts/${post.slug}`} className="block">
      <article className="flex flex-col gap-4 p-4 bg-card rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-all group cursor-pointer h-full">
        {/* 표지 이미지 */}
        <div className="overflow-hidden rounded-lg aspect-[16/9]">
          <img
            src={post.coverImage || "/placeholder.svg"}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Tags */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {post.tags.slice(0, 3).map(({ tag }) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.06] text-[#dcddde]/60"
              >
                {tag.name}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-[#dcddde] mb-1.5 leading-snug group-hover:text-primary transition-colors break-keep line-clamp-2">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-[#dcddde]/50 text-sm leading-relaxed mb-3 line-clamp-2 break-keep">
            {generateExcerpt(post.excerpt || post.content || "")}
          </p>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between text-xs text-[#dcddde]/30">
            <div className="flex items-center gap-2">
              <span
                role="link"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/users/@${post.author.username}`);
                }}
                className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
              >
                {post.author.image ? (
                  <img
                    src={post.author.image}
                    alt={post.author.name || "Author"}
                    className="size-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[8px] font-bold">
                    {post.author.name?.[0]?.toUpperCase() || "A"}
                  </div>
                )}
                <span className="font-medium text-[#dcddde]/60">
                  {post.author.name}
                </span>
              </span>
              <span>&middot;</span>
              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  favorite
                </span>
                {post._count.likes}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  chat_bubble
                </span>
                {post._count.comments}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
