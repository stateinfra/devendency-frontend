"use client";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) {
    pages.push("...");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  pages.push(total);

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = getPageNumbers(currentPage, totalPages);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      <button
        onClick={() => canPrev && onPageChange(currentPage - 1)}
        disabled={!canPrev}
        className={cn(
          "inline-flex items-center justify-center size-10 rounded-full transition-colors",
          canPrev
            ? "text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            : "text-gray-300 dark:text-[#dcddde]/20 cursor-not-allowed"
        )}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {pages.map((page, idx) =>
        page === "..." ? (
          <span key={`ellipsis-${idx}`} className="inline-flex items-center justify-center size-10 text-sm text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "inline-flex items-center justify-center size-10 rounded-full text-sm font-medium transition-colors",
              page === currentPage
                ? "bg-[#7f6df2] text-white"
                : "text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => canNext && onPageChange(currentPage + 1)}
        disabled={!canNext}
        className={cn(
          "inline-flex items-center justify-center size-10 rounded-full transition-colors",
          canNext
            ? "text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            : "text-gray-300 dark:text-[#dcddde]/20 cursor-not-allowed"
        )}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </nav>
  );
}
