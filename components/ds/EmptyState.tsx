function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface EmptyStateProps {
  icon: string;
  message: string;
  className?: string;
}

export function EmptyState({ icon, message, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-8", className)}>
      <span
        className="material-symbols-outlined text-gray-300 dark:text-[#dcddde]/20"
        style={{ fontSize: 48 }}
      >
        {icon}
      </span>
      <p className="text-sm text-gray-400 dark:text-[#dcddde]/30 mt-3">
        {message}
      </p>
    </div>
  );
}
