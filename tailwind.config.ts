import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        "primary-hover": "#2563eb",
        "background-light": "#F9FAFB",
        "background-dark": "#1f2937",
        "surface-light": "#ffffff",
        "surface-dark": "#374151",
        "text-main": "#111827",
        "text-muted": "#6b7280",
        "code-bg": "#ECEFF4",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "monospace"],
      },
      lineHeight: {
        "korean-relaxed": "1.8",
      },
      letterSpacing: {
        "korean-wide": "-0.025em",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
