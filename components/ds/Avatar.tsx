"use client";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string;
  initial: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: "size-5",
  sm: "size-8",
  md: "size-9",
  lg: "size-12",
  xl: "size-20",
};

const fontSizeStyles: Record<AvatarSize, string> = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-3xl",
};

export function Avatar({ src, initial, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={initial}
        className={cn(
          "rounded-full object-cover",
          sizeStyles[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-black/[0.06] dark:bg-white/[0.08] text-gray-500 dark:text-[#dcddde]/50 font-semibold",
        sizeStyles[size],
        fontSizeStyles[size],
        className
      )}
    >
      {initial}
    </div>
  );
}
