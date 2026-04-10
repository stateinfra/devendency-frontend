"use client";

import { type ReactNode, useEffect } from "react";

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type ModalSize = "sm" | "md";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  children?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sizeStyles: Record<ModalSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white dark:bg-[#2a2a2a] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-2xl w-full mx-4",
          sizeStyles[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 dark:text-[#dcddde]/50 mb-4">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
