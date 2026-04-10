"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, rows = 3, className, ...props }, ref) => {
    const textareaStyles = cn(
      "w-full px-4 py-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] text-gray-900 dark:text-[#dcddde] placeholder:text-gray-400 dark:placeholder:text-[#dcddde]/30 outline-none transition-colors resize-none text-sm",
      "focus:ring-2 focus:ring-[#7f6df2]/20 focus:border-[#7f6df2]",
      error
        ? "border border-red-500"
        : "border border-black/[0.06] dark:border-white/[0.06]",
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
        <textarea
          ref={ref}
          rows={rows}
          className={textareaStyles}
          {...props}
        />
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

Textarea.displayName = "Textarea";
