import Link from "next/link";

type FollowStatsProps = {
  username: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  totalLikes: number;
};

export function FollowStats({
  username,
  postCount,
  followerCount,
  followingCount,
  totalLikes,
}: FollowStatsProps) {
  const linkClass =
    "flex gap-1.5 items-center hover:opacity-70 transition-opacity";

  return (
    <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
      <div className="flex gap-1.5 items-center">
        <span className="font-bold text-white">{postCount}</span>
        <span className="text-slate-500">포스트</span>
      </div>
      <Link href={`/users/@${username}/followers`} className={linkClass}>
        <span className="font-bold text-white">{followerCount}</span>
        <span className="text-slate-500">팔로워</span>
      </Link>
      <Link href={`/users/@${username}/following`} className={linkClass}>
        <span className="font-bold text-white">{followingCount}</span>
        <span className="text-slate-500">팔로잉</span>
      </Link>
      <div className="flex gap-1.5 items-center">
        <span className="font-bold text-white">{totalLikes}</span>
        <span className="text-slate-500">좋아요</span>
      </div>
    </div>
  );
}
