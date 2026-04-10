function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type SkeletonVariant = "text" | "circle" | "rect";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  className,
}: SkeletonProps) {
  const variantStyles: Record<SkeletonVariant, string> = {
    text: "h-4 rounded bg-black/[0.08] dark:bg-white/[0.06] animate-pulse",
    circle: "rounded-full bg-black/[0.08] dark:bg-white/[0.06] animate-pulse",
    rect: "rounded-lg aspect-[16/9] bg-black/[0.08] dark:bg-white/[0.06] animate-pulse",
  };

  return (
    <div
      className={cn(variantStyles[variant], className)}
      style={{
        width: width ?? (variant === "text" ? "100%" : undefined),
        height: height ?? (variant === "circle" ? width : undefined),
      }}
    />
  );
}
