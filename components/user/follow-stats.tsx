import Link from "next/link";

type FollowStatsProps = {
  username: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
};

export function FollowStats({
  username,
  postCount,
  followerCount,
  followingCount,
}: FollowStatsProps) {
  const linkClass =
    "flex gap-1.5 items-center hover:opacity-70 transition-opacity";

  return (
    <div className="flex items-center gap-4 sm:gap-6 text-sm">
      <div className="flex gap-1.5 items-center">
        <span className="font-bold text-gray-900 dark:text-white">{postCount}</span>
        <span className="text-slate-500">포스트</span>
      </div>
      <Link href={`/users/@${username}/followers`} className={linkClass}>
        <span className="font-bold text-gray-900 dark:text-white">{followerCount}</span>
        <span className="text-slate-500">팔로워</span>
      </Link>
      <Link href={`/users/@${username}/following`} className={linkClass}>
        <span className="font-bold text-gray-900 dark:text-white">{followingCount}</span>
        <span className="text-slate-500">팔로잉</span>
      </Link>
    </div>
  );
}
