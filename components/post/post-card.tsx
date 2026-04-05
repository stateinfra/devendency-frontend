"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, generateExcerpt } from "@/lib/utils";
import type { PostWithRelations } from "@/types";
import { SkeletonImage } from "@/components/shared/skeleton-image";
import { useTheme } from "@/components/theme-provider";

export function PostCard({ post }: { post: PostWithRelations }) {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <Link href={`/posts/${post.slug}`} className="block">
      <article className="flex flex-col gap-4 group cursor-pointer h-full rounded-xl p-3 -m-3 transition-all duration-200 ease-in-out hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
        {/* 표지 이미지 */}
        <div className="overflow-hidden rounded-lg aspect-[16/9]">
          {post.coverImage ? (
            <SkeletonImage
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={theme === "dark" ? "/placeholder.svg" : "/placeholder-light.svg"}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Title */}
          <h3 className="text-base font-bold text-gray-900 dark:text-[#dcddde] mb-1.5 leading-snug group-hover:text-primary transition-colors break-keep line-clamp-2">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-500 dark:text-[#dcddde]/50 text-xs leading-relaxed mb-3 line-clamp-1 break-keep">
            {generateExcerpt(post.excerpt || post.content || "")}
          </p>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between text-xs text-gray-400 dark:text-[#dcddde]/30">
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
                  <SkeletonImage
                    src={post.author.image}
                    alt={post.author.name || "Author"}
                    className="size-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] flex items-center justify-center text-[8px] font-bold">
                    {post.author.name?.[0]?.toUpperCase() || "A"}
                  </div>
                )}
                <span className="font-medium text-gray-600 dark:text-[#dcddde]/60">
                  {post.author.name}
                </span>
              </span>
              <span>&middot;</span>
              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
              <span>&middot;</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                  favorite
                </span>
                {post._count.likes}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
