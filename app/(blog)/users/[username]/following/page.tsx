import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { users, follows } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getFollowList } from "@/actions/follow";
import { FollowButton } from "@/components/user/follow-button";
import type { Metadata } from "next";

type Props = { params: Promise<{ username: string }> };

function cleanUsername(raw: string) {
  const decoded = decodeURIComponent(raw);
  return decoded.startsWith("@") ? decoded.slice(1) : decoded;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await db.query.users.findFirst({
    where: eq(users.username, cleanUsername(username)),
    columns: { name: true },
  });
  if (!user) return { title: "사용자를 찾을 수 없습니다" };
  return { title: `${user.name}의 팔로잉` };
}

export default async function FollowingPage({ params }: Props) {
  const { username } = await params;
  const clean = cleanUsername(username);
  const session = await auth();

  const user = await db.query.users.findFirst({
    where: eq(users.username, clean),
    columns: { id: true, name: true, username: true },
  });
  if (!user) notFound();

  const list = await getFollowList(user.id, "following");

  // 현재 로그인 유저가 팔로우하는 ID 목록
  const myFollowingIds = session?.user
    ? new Set(
        (
          await db.query.follows.findMany({
            where: eq(follows.followerId, session.user.id),
            columns: { followingId: true },
          })
        ).map((r) => r.followingId),
      )
    : new Set<string>();

  return (
    <div className="w-full max-w-[600px] mx-auto py-10">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/users/@${user.username}`}
          className="size-9 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">팔로잉</h1>
          <p className="text-sm text-slate-500">@{user.username}</p>
        </div>
      </div>

      {/* 목록 */}
      {list.length === 0 ? (
        <p className="text-center text-slate-500 py-16">아직 팔로잉하는 사람이 없습니다</p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {list.map((u) => (
            <li key={u.id} className="flex items-center gap-4 py-4">
              <Link href={`/users/@${u.username}`} className="shrink-0">
                {u.image ? (
                  <Image
                    src={u.image}
                    alt={u.name || ""}
                    width={44}
                    height={44}
                    className="rounded-full object-cover size-11"
                  />
                ) : (
                  <div className="size-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    {u.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </Link>
              <Link href={`/users/@${u.username}`} className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{u.name}</p>
                <p className="text-xs text-slate-500 truncate">@{u.username}</p>
              </Link>
              {session?.user && session.user.id !== u.id && (
                <FollowButton
                  targetUserId={u.id}
                  initialFollowing={myFollowingIds.has(u.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
