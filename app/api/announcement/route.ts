import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { publicPostWhere } from "@/lib/db/post-visibility";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const post = await db.query.posts.findFirst({
    where: and(eq(posts.isAnnouncement, true), publicPostWhere),
    columns: { title: true, slug: true },
  });

  return NextResponse.json({ post: post ?? null });
}
