"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="테마 전환"
      className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-slate-300 transition-colors"
    >
      <span className="material-symbols-outlined text-[22px]">
        {theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
