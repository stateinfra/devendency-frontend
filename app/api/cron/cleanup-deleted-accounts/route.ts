import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const deletedUsers = await db
    .delete(users)
    .where(lte(users.deletionScheduledAt, now))
    .returning({ id: users.id, email: users.email });

  return NextResponse.json({
    deleted: deletedUsers.length,
    users: deletedUsers.map((u) => u.id),
  });
}
