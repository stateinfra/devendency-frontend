"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type InputSize = "sm" | "md";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helperText?: string;
  error?: string;
  prefix?: string;
  size?: InputSize;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      prefix,
      size = "md",
      className,
      ...props
    },
    ref
  ) => {
    const sizeStyles: Record<InputSize, string> = {
      sm: "h-8 text-sm",
      md: "h-10 text-sm",
    };

    const inputStyles = cn(
      "w-full px-3 bg-black/[0.04] dark:bg-white/[0.04] text-gray-900 dark:text-[#dcddde] placeholder:text-gray-400 dark:placeholder:text-[#dcddde]/30 outline-none transition-colors",
      "focus:ring-2 focus:ring-[#7f6df2]/20 focus:border-[#7f6df2]",
      sizeStyles[size],
      error
        ? "border border-red-500"
        : "border border-black/[0.06] dark:border-white/[0.06]",
      prefix ? "rounded-r-lg border-l-0" : "rounded-lg",
      props.disabled && "opacity-50 cursor-not-allowed",
      className
    );

    return (
      <div>
        {label && (
          <label className="text-xs font-semibold text-gray-500 dark:text-[#dcddde]/70 mb-1.5 block">
            {label}
          </label>
        )}
        <div className="flex">
          {prefix && (
            <span
              className={cn(
                "inline-flex items-center px-3 rounded-l-lg border bg-black/[0.06] dark:bg-white/[0.06] text-gray-500 dark:text-[#dcddde]/50 text-sm select-none",
                error
                  ? "border-red-500"
                  : "border-black/[0.06] dark:border-white/[0.06]"
              )}
            >
              {prefix}
            </span>
          )}
          <input ref={ref} className={inputStyles} {...props} />
        </div>
        {error && (
          <p className="text-[11px] text-red-500 mt-1.5">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-[11px] text-gray-400 dark:text-[#dcddde]/30 mt-1.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
