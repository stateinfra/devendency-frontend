import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileText, Eye, Heart, MessageCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대시보드",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [postCount, totalViews, totalLikes, totalComments] = await Promise.all([
    prisma.post.count({ where: { authorId: session.user.id } }),
    prisma.post.aggregate({
      where: { authorId: session.user.id },
      _sum: { viewCount: true },
    }),
    prisma.like.count({
      where: { post: { authorId: session.user.id } },
    }),
    prisma.comment.count({
      where: { post: { authorId: session.user.id } },
    }),
  ]);

  const stats = [
    { label: "작성한 글", value: postCount, icon: FileText },
    { label: "총 조회수", value: totalViews._sum.viewCount || 0, icon: Eye },
    { label: "받은 좋아요", value: totalLikes, icon: Heart },
    { label: "받은 댓글", value: totalComments, icon: MessageCircle },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">대시보드</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
