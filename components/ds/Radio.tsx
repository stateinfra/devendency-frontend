"use client";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface RadioProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
}

export function Radio({
  checked,
  onChange,
  label,
  disabled = false,
  name,
  className,
}: RadioProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2.5",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <button
        role="radio"
        aria-checked={checked}
        disabled={disabled}
        data-name={name}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "inline-flex items-center justify-center size-[18px] rounded-full border-2 transition-colors",
          checked
            ? "border-[#7f6df2]"
            : "border-gray-300 dark:border-[#dcddde]/20"
        )}
      >
        {checked && (
          <span className="size-2.5 rounded-full bg-[#7f6df2]" />
        )}
      </button>
      {label && (
        <span className="text-sm text-gray-900 dark:text-[#dcddde]">
          {label}
        </span>
      )}
    </label>
  );
}
