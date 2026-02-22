import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="flex items-center justify-center gap-1">
      <Button variant="ghost" size="icon" asChild disabled={currentPage <= 1}>
        <Link href={`${baseUrl}${separator}page=${currentPage - 1}`}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>
      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "ghost"}
          size="icon"
          asChild
        >
          <Link href={`${baseUrl}${separator}page=${page}`}>{page}</Link>
        </Button>
      ))}
      <Button
        variant="ghost"
        size="icon"
        asChild
        disabled={currentPage >= totalPages}
      >
        <Link href={`${baseUrl}${separator}page=${currentPage + 1}`}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
