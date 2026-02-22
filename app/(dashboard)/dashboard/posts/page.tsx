import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Plus, Edit, Eye } from "lucide-react";
import { DeletePostButton } from "@/components/post/delete-post-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 글 관리",
};

export default async function DashboardPostsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const posts = await prisma.post.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">내 글 관리</h1>
        <Button asChild>
          <Link href="/dashboard/posts/new">
            <Plus className="h-4 w-4 mr-2" />새 글 작성
          </Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          아직 작성한 글이 없습니다.
        </p>
      ) : (
        <div className="border rounded-lg divide-y">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between p-4"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{post.title}</h3>
                  <Badge variant={post.published ? "default" : "secondary"}>
                    {post.published ? "공개" : "임시저장"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {post.category && <span>{post.category.name}</span>}
                  <span>{formatDate(post.createdAt)}</span>
                  <span>조회 {post.viewCount}</span>
                  <span>좋아요 {post._count.likes}</span>
                  <span>댓글 {post._count.comments}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                {post.published && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/posts/${post.slug}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dashboard/posts/${post.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <DeletePostButton postId={post.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
