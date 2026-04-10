import Link from "next/link";
import { Button } from "@/components/ds";

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
        <Link href={`${baseUrl}${separator}page=${currentPage - 1}`}>
          <Button variant="ghost" size="sm" pill iconOnly>
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </Button>
        </Link>
      )}
      {pages.map((page) => (
        <Link key={page} href={`${baseUrl}${separator}page=${page}`}>
          <Button
            variant={page === currentPage ? "primary" : "ghost"}
            size="sm"
            pill
            iconOnly
            className={page !== currentPage ? "text-[#dcddde]/50" : ""}
          >
            {page}
          </Button>
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link href={`${baseUrl}${separator}page=${currentPage + 1}`}>
          <Button variant="ghost" size="sm" pill iconOnly>
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </Button>
        </Link>
      )}
    </div>
  );
}
