import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
};

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const separator = baseUrl.includes("?") ? "&" : "?";

  return (
    <div className="pt-6 flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <Link
          href={`${baseUrl}${separator}page=${currentPage - 1}`}
          className="size-10 flex items-center justify-center rounded-full hover:bg-white/[0.06] text-[#dcddde]/50 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </Link>
      )}
      {pages.map((page) => (
        <Link
          key={page}
          href={`${baseUrl}${separator}page=${page}`}
          className={`size-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
            page === currentPage
              ? "bg-primary text-white"
              : "text-[#dcddde]/50 hover:bg-white/[0.06]"
          }`}
        >
          {page}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link
          href={`${baseUrl}${separator}page=${currentPage + 1}`}
          className="size-10 flex items-center justify-center rounded-full hover:bg-white/[0.06] text-[#dcddde]/50 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </Link>
      )}
    </div>
  );
}
