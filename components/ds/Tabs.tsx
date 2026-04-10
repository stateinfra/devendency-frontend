"use client";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface TabItem {
  key: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: "pill" | "underline";
  className?: string;
}

export function Tabs({
  items,
  activeKey,
  onChange,
  variant = "pill",
  className,
}: TabsProps) {
  if (variant === "underline") {
    return (
      <div className={cn("flex gap-6 border-b border-black/[0.06] dark:border-white/[0.06]", className)}>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={cn(
                "inline-flex items-center gap-1.5 pb-2.5 text-sm font-medium transition-colors -mb-px",
                isActive
                  ? "border-b-2 border-[#7f6df2] text-[#7f6df2]"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              {item.icon && (
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-1 p-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]", className)}>
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-[#7f6df2]/10 text-[#7f6df2]"
                : "text-gray-400 hover:text-gray-600 hover:bg-black/[0.04] dark:hover:text-gray-300 dark:hover:bg-white/[0.04]"
            )}
          >
            {item.icon && (
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                {item.icon}
              </span>
            )}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
