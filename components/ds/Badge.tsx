"use client";

import { type ReactNode } from "react";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type BadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "admin"
  | "writer"
;

type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children?: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-[#7f6df2]/10 text-[#7f6df2]",
  success: "bg-[#22c55e]/10 text-[#22c55e]",
  warning: "bg-[#f59e0b]/10 text-[#f59e0b]",
  danger: "bg-[#ef4444]/10 text-[#ef4444]",
  info: "bg-[#3b82f6]/10 text-[#3b82f6]",
  neutral: "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-[#dcddde]/50",
  admin: "bg-[#7f6df2]/10 text-[#7f6df2]",
  writer: "bg-emerald-500/10 text-emerald-400",
};

export function Badge({
  variant = "primary",
  size = "md",
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
