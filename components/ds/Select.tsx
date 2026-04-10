"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, helperText, error, options, placeholder, className, ...props },
    ref
  ) => {
    const selectStyles = cn(
      "w-full h-10 px-3 pr-10 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] text-gray-900 dark:text-[#dcddde] outline-none transition-colors appearance-none text-sm",
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
        <div className="relative">
          <select ref={ref} className={selectStyles} {...props}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-[#dcddde]/50"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
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

Select.displayName = "Select";
