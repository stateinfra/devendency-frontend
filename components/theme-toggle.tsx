"use client";

import { useTheme } from "./theme-provider";

const MODES = [
  { key: "light" as const, icon: "light_mode" },
  { key: "auto" as const, icon: "routine" },
  { key: "dark" as const, icon: "dark_mode" },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.06] rounded-full p-0.5">
      {MODES.map((m) => (
        <button
          key={m.key}
          onClick={() => setMode(m.key)}
          aria-label={`${m.key} 테마`}
          className={`size-8 flex items-center justify-center rounded-full transition-all ${
            mode === m.key
              ? "bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, width: 16, height: 16, fontVariationSettings: "'opsz' 16, 'wght' 400" }}>{m.icon}</span>
        </button>
      ))}
    </div>
  );
}
