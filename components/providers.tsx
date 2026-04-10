"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "./theme-provider";

function ThemedToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme === "dark" ? "dark" : "light"}
      position="bottom-center"
      gap={8}
      toastOptions={{
        style: {
          background: theme === "dark" ? "#2a2a2a" : "#ffffff",
          border: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
          color: theme === "dark" ? "#dcddde" : "#1a1a1a",
          borderRadius: "12px",
          fontSize: "13px",
          fontFamily: "var(--font-sans)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          padding: "12px 16px",
        },
        classNames: {
          success: "!border-[#22c55e]/20",
          error: "!border-[#ef4444]/20",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <ThemedToaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
