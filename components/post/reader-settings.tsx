"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

type FontFamily = "sans" | "serif" | "mono";

type Settings = {
  fontScale: number;
  fontFamily: FontFamily;
  lineHeight: number;
  width: number;
  focus: boolean;
};

const DEFAULTS: Settings = {
  fontScale: 100,
  fontFamily: "sans",
  lineHeight: 1.75,
  width: 760,
  focus: false,
};

const STORAGE_KEY = "devlog:reader-settings";

const FONT_STACKS: Record<FontFamily, string> = {
  sans: `"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`,
  serif: `"Noto Serif KR", "Nanum Myeongjo", ui-serif, Georgia, Cambria, Batang, serif`,
  mono: `"Fira Code", "JetBrains Mono", Consolas, monospace`,
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function applySettings(s: Settings) {
  const root = document.documentElement;
  root.style.setProperty("--reader-font-size", `${s.fontScale / 100}rem`);
  root.style.setProperty("--reader-font-family", FONT_STACKS[s.fontFamily]);
  root.style.setProperty("--reader-line-height", String(s.lineHeight));
  root.style.setProperty("--reader-content-width", `${s.width}px`);
  document.body.classList.toggle("reader-focus", s.focus);
}

function clearSettings() {
  const root = document.documentElement;
  root.style.removeProperty("--reader-font-size");
  root.style.removeProperty("--reader-font-family");
  root.style.removeProperty("--reader-line-height");
  root.style.removeProperty("--reader-content-width");
  document.body.classList.remove("reader-focus");
}

export function ReaderSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    applySettings(s);
    return () => clearSettings();
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      applySettings(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Anchor the portaled popover to the trigger button's viewport position.
  useEffect(() => {
    if (!open) {
      setPopoverPos(null);
      return;
    }
    const compute = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPopoverPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (settings.focus) update({ focus: false });
      else if (open) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, settings.focus, update]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("reader-modal-open");
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove("reader-modal-open");
    };
  }, [open]);

  const popover = open && popoverPos ? (
    <>
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-[9998] bg-gray-500/25 dark:bg-black/50"
      />
      <div
        className="fixed w-[280px] bg-white dark:bg-[#2a2a2a] rounded-xl border border-black/10 dark:border-white/10 shadow-lg z-[10000] p-4 space-y-4"
        style={{ top: popoverPos.top, right: popoverPos.right }}
      >
          <Row label="글자 크기">
            <div className="flex items-center gap-1 h-9">
              <button
                onClick={() =>
                  update({ fontScale: Math.max(80, settings.fontScale - 10) })
                }
                className="size-9 rounded-lg border border-black/10 dark:border-white/10 flex items-center justify-center text-sm hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
                disabled={settings.fontScale <= 80}
                aria-label="글자 줄이기"
              >
                <span className="material-symbols-outlined text-[16px]">remove</span>
              </button>
              <div className="flex-1 text-center text-sm tabular-nums text-gray-700 dark:text-slate-200">
                {settings.fontScale}%
              </div>
              <button
                onClick={() =>
                  update({ fontScale: Math.min(140, settings.fontScale + 10) })
                }
                className="size-9 rounded-lg border border-black/10 dark:border-white/10 flex items-center justify-center text-sm hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
                disabled={settings.fontScale >= 140}
                aria-label="글자 키우기"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
          </Row>

          <Row label="글꼴">
            <Segmented
              value={settings.fontFamily}
              options={[
                { value: "sans", label: "본문" },
                { value: "serif", label: "명조" },
                { value: "mono", label: "고정폭" },
              ]}
              onChange={(v) => update({ fontFamily: v as FontFamily })}
            />
          </Row>

          <Row label="줄 간격">
            <Segmented
              value={String(settings.lineHeight)}
              options={[
                { value: "1.5", label: "촘촘" },
                { value: "1.75", label: "보통" },
                { value: "2", label: "여유" },
              ]}
              onChange={(v) => update({ lineHeight: parseFloat(v) })}
            />
          </Row>

          <Row label="본문 폭">
            <Segmented
              value={String(settings.width)}
              options={[
                { value: "600", label: "좁게" },
                { value: "760", label: "보통" },
                { value: "900", label: "넓게" },
              ]}
              onChange={(v) => update({ width: parseInt(v, 10) })}
            />
          </Row>

          <button
            onClick={() => update({ focus: !settings.focus })}
            className={`w-full h-9 rounded-lg border text-sm flex items-center justify-center gap-2 transition-colors ${
              settings.focus
                ? "bg-primary/10 border-primary/40 text-primary"
                : "border-black/10 dark:border-white/10 text-gray-500 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {settings.focus ? "center_focus_strong" : "center_focus_weak"}
            </span>
            {settings.focus ? "Zen 모드 (ESC로 해제)" : "Zen 모드"}
          </button>

          <div className="pt-2 border-t border-black/10 dark:border-white/10 flex justify-end">
            <button
              onClick={() => update(DEFAULTS)}
              className="text-xs text-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              기본값으로
            </button>
          </div>
      </div>
    </>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="리더 설정"
        title="리더 설정"
        className={`size-9 flex items-center justify-center rounded-full border transition-all ${
          open
            ? "text-gray-900 dark:text-white bg-black/[0.1] dark:bg-white/[0.14] border-black/[0.1] dark:border-white/[0.1]"
            : "text-gray-600 dark:text-slate-300 bg-black/[0.06] dark:bg-white/[0.08] border-black/[0.1] dark:border-white/[0.1] hover:bg-black/[0.1] dark:hover:bg-white/[0.14]"
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>text_format</span>
      </button>
      {mounted && popover ? createPortal(popover, document.body) : null}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-black/10 dark:border-white/10 p-0.5 bg-black/[0.02] dark:bg-white/[0.02]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 h-8 text-xs font-medium rounded-md transition-colors ${
            value === opt.value
              ? "bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-gray-700 dark:hover:text-slate-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * FOUC guard: inline script that applies saved settings before React hydrates.
 * Must run synchronously in <head> / before the article renders.
 */
export function ReaderSettingsBootstrap() {
  const script = `
    (function(){
      try {
        var raw = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
        if (!raw) return;
        var s = JSON.parse(raw);
        var stacks = ${JSON.stringify(FONT_STACKS)};
        var r = document.documentElement.style;
        if (typeof s.fontScale === 'number') r.setProperty('--reader-font-size', (s.fontScale/100)+'rem');
        if (s.fontFamily && stacks[s.fontFamily]) r.setProperty('--reader-font-family', stacks[s.fontFamily]);
        if (typeof s.lineHeight === 'number') r.setProperty('--reader-line-height', String(s.lineHeight));
        if (typeof s.width === 'number') r.setProperty('--reader-content-width', s.width+'px');
        /* focus-mode body class is toggled post-hydration in useEffect to avoid body className mismatch */
      } catch(e){}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
