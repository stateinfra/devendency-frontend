import { type ReactNode } from "react";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type CardVariant = "default" | "settings" | "alert" | "interactive";
type CardPadding = "sm" | "md" | "lg";
type AlertVariant = "info" | "danger";

interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  alertVariant?: AlertVariant;
  className?: string;
  children?: ReactNode;
}

export function Card({
  variant = "default",
  padding = "md",
  alertVariant = "info",
  className,
  children,
}: CardProps) {
  const paddingStyles: Record<CardPadding, string> = {
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
  };

  const variantStyles: Record<CardVariant, string> = {
    default:
      "rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#262626]",
    settings:
      "rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-card",
    alert:
      alertVariant === "danger"
        ? "rounded-lg bg-red-500/5 border border-red-500/10"
        : "rounded-lg bg-[#7f6df2]/5 border border-[#7f6df2]/10",
    interactive:
      "rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#262626] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] cursor-pointer transition-colors",
  };

  return (
    <div
      className={cn(
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
