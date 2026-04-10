"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  iconOnly?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  pill = false,
  iconOnly = false,
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f6df2]/50 focus-visible:ring-offset-2";

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-[#7f6df2] text-white hover:bg-[#6c5ce7] active:bg-[#5a4bd4] dark:bg-[#7f6df2] dark:hover:bg-[#6c5ce7] dark:active:bg-[#5a4bd4]",
    secondary:
      "bg-black/[0.06] text-gray-900 hover:bg-black/[0.10] active:bg-black/[0.14] border border-black/[0.06] dark:bg-white/[0.08] dark:text-gray-100 dark:hover:bg-white/[0.12] dark:active:bg-white/[0.16] dark:border-white/[0.06]",
    outline:
      "border border-black/[0.06] text-gray-900 hover:bg-black/[0.04] active:bg-black/[0.08] dark:border-white/[0.06] dark:text-gray-100 dark:hover:bg-white/[0.06] dark:active:bg-white/[0.10]",
    ghost:
      "text-gray-900 hover:bg-black/[0.06] active:bg-black/[0.10] dark:text-gray-100 dark:hover:bg-white/[0.08] dark:active:bg-white/[0.12]",
    danger:
      "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 dark:active:bg-red-800",
  };

  const sizeStyles: Record<ButtonSize, string> = iconOnly
    ? { sm: "size-8", md: "size-9", lg: "size-10" }
    : {
        sm: "h-8 px-3 text-sm gap-1.5",
        md: "h-9 px-4 text-sm gap-2",
        lg: "h-10 px-5 text-base gap-2",
      };

  const radiusStyle = pill ? "rounded-full" : "rounded-lg";

  const disabledStyle = isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        radiusStyle,
        disabledStyle,
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
