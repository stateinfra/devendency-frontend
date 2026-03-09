"use client"

import { PostCard } from "@/components/post/post-card";
import { Pagination } from "@/components/shared/pagination";
import type { PostWithRelations } from "@/types";

type PostListProps = {
  posts: PostWithRelations[];
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
};

export function PostList({
  posts,
  currentPage,
  totalPages,
  baseUrl = "/",
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-[48px] text-[#dcddde]/20 mb-4 block">article</span>
        <p className="text-[#dcddde]/40">아직 작성된 글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
}
