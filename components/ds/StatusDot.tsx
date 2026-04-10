"use client";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type StatusType = "success" | "warning" | "danger";

interface StatusDotProps {
  status: StatusType;
  label: string;
}

const dotStyles: Record<StatusType, string> = {
  success: "bg-emerald-400",
  warning: "bg-yellow-400",
  danger: "bg-red-400",
};

const labelStyles: Record<StatusType, string> = {
  success: "text-emerald-400",
  warning: "text-yellow-400",
  danger: "text-red-400",
};

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", dotStyles[status])} />
      <span className={cn("text-xs", labelStyles[status])}>{label}</span>
    </span>
  );
}
