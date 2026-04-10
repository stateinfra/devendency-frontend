"use client";

import { type ReactNode, useState, useEffect, useRef } from "react";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface DropdownItem {
  label: string;
  icon?: string;
  onClick?: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

export function DropdownMenu({
  trigger,
  items,
  align = "left",
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>

      {open && (
        <div
          className={cn(
            "absolute w-48 py-1 bg-white dark:bg-[#2a2a2a] rounded-xl border border-black/[0.08] dark:border-white/[0.08] shadow-lg z-50 mt-1",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, index) =>
            item.divider ? (
              <div
                key={index}
                className="border-t border-black/[0.08] dark:border-white/[0.08] my-1"
              />
            ) : (
              <div
                key={index}
                className={cn(
                  "px-3 py-2 text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer flex items-center gap-2",
                  item.danger && "text-red-500"
                )}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
              >
                {item.icon && (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16 }}
                  >
                    {item.icon}
                  </span>
                )}
                {item.label}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
