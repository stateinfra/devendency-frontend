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
      <div className="text-center py-12">
        <p className="text-muted-foreground">아직 작성된 글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
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
