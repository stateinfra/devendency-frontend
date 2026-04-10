"use client";

import { type ReactNode } from "react";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface TagProps {
  children?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Tag({ children, active = false, onClick, className }: TagProps) {
  return (
    <span
      role={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors",
        active
          ? "bg-[#7f6df2]/10 text-[#7f6df2]"
          : "bg-black/[0.04] dark:bg-white/[0.06] text-gray-600 dark:text-[#dcddde]/60 hover:bg-[#7f6df2]/10 hover:text-[#7f6df2]",
        className
      )}
    >
      {children}
    </span>
  );
}
