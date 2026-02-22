import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Heart, MessageCircle, Eye } from "lucide-react";
import type { PostWithRelations } from "@/types";

export function PostCard({ post }: { post: PostWithRelations }) {
  const initials = post.author.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "A";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        {post.category && (
          <Link href={`/categories/${post.category.slug}`}>
            <Badge variant="secondary" className="w-fit mb-2">
              {post.category.name}
            </Badge>
          </Link>
        )}
        <Link href={`/posts/${post.slug}`}>
          <h2 className="text-xl font-semibold hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {post.excerpt}
        </p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {post.tags.map(({ tag }) => (
              <Link key={tag.id} href={`/tags/${tag.slug}`}>
                <Badge variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.author.image || undefined} />
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span>{post.author.name}</span>
            <span>&middot;</span>
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {post.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {post._count.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {post._count.comments}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
