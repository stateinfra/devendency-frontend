"use client";

import { useEffect, useRef, useState } from "react";

export function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const panRef = useRef<HTMLDivElement>(null);
  const zoomIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  scaleRef.current = scale;
  offsetRef.current = offset;

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const { default: mermaid } = await import("mermaid");
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          darkMode: true,
          background: "#1a1a1a",
          primaryColor: "#7f6df2",
          primaryTextColor: "#dcddde",
          lineColor: "#555",
        },
      });

      try {
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, chart.trim());
        if (!cancelled) {
          setSvg(svg);
          if (containerRef.current) containerRef.current.innerHTML = svg;
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to render diagram");
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  // Close on Esc; reset transform when opening; lock body scroll
  useEffect(() => {
    if (!zoomOpen) return;
    setScale(1);
    setOffset({ x: 0, y: 0 });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [zoomOpen]);

  // Non-passive wheel listener — zoom toward cursor
  useEffect(() => {
    if (!zoomOpen) return;
    const el = panRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const raw = Math.exp(-dy * 0.0015);

      const s = scaleRef.current;
      const o = offsetRef.current;
      const next = Math.min(10, Math.max(0.2, s * raw));
      if (next === s) return;
      const k = next / s;
      const newOffset = {
        x: o.x * k + (sx - cx) * (1 - k),
        y: o.y * k + (sy - cy) * (1 - k),
      };

      scaleRef.current = next;
      offsetRef.current = newOffset;
      setScale(next);
      setOffset(newOffset);

      setIsZooming(true);
      if (zoomIdleTimer.current) clearTimeout(zoomIdleTimer.current);
      zoomIdleTimer.current = setTimeout(() => setIsZooming(false), 180);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (zoomIdleTimer.current) clearTimeout(zoomIdleTimer.current);
    };
  }, [zoomOpen]);

  if (error) {
    return (
      <pre className="text-red-400 bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-lg overflow-x-auto text-sm">
        <code>{chart}</code>
        <div className="mt-2 text-xs text-red-500">Mermaid error: {error}</div>
      </pre>
    );
  }

  return (
    <>
      <div className="my-6 relative group rounded-lg bg-gray-50 dark:bg-[#1a1a1a]">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          disabled={!svg}
          title="크게 보기"
          className="absolute top-2 right-2 z-10 size-8 flex items-center justify-center rounded-lg bg-white/70 dark:bg-black/40 backdrop-blur text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-black/60 transition disabled:opacity-0"
          aria-label="크게 보기"
        >
          <span className="material-symbols-outlined text-[18px]">
            zoom_out_map
          </span>
        </button>
        <div
          ref={containerRef}
          className="flex justify-center overflow-x-auto p-4"
        />
      </div>

      {zoomOpen && svg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          onClick={() => setZoomOpen(false)}
        >
          <div
            className="relative w-[95vw] h-[95vh] rounded-lg bg-[#1a1a1a] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setScale(1);
                  setOffset({ x: 0, y: 0 });
                }}
                aria-label="원본 크기"
                title="원본 크기 (1:1)"
                className="size-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
              >
                <span className="material-symbols-outlined text-[20px]">
                  center_focus_strong
                </span>
              </button>
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                aria-label="닫기"
                className="size-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-white/10 text-slate-300 text-[11px] backdrop-blur select-none pointer-events-none">
              휠 확대/축소 · 드래그 이동 · {Math.round(scale * 100)}%
            </div>
            <div
              ref={panRef}
              className="flex-1 min-h-0 overflow-hidden flex items-center justify-center select-none"
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                dragStart.current = {
                  x: e.clientX,
                  y: e.clientY,
                  ox: offset.x,
                  oy: offset.y,
                };
                setIsDragging(true);
              }}
              onMouseMove={(e) => {
                if (!dragStart.current) return;
                setOffset({
                  x: dragStart.current.ox + (e.clientX - dragStart.current.x),
                  y: dragStart.current.oy + (e.clientY - dragStart.current.y),
                });
              }}
              onMouseUp={() => {
                dragStart.current = null;
                setIsDragging(false);
              }}
              onMouseLeave={() => {
                dragStart.current = null;
                setIsDragging(false);
              }}
            >
              <div
                className="w-full h-full flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-none [&_svg]:max-h-none transition-transform"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transformOrigin: "center center",
                  transitionDuration: isDragging || isZooming ? "0ms" : "120ms",
                }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
