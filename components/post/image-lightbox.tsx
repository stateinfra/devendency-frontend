"use client";

import { useEffect, useRef, useState } from "react";
import { SkeletonImage } from "@/components/shared/skeleton-image";

export function ImageLightbox({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [open, setOpen] = useState(false);
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

  // Reset + lock body scroll + Esc to close
  useEffect(() => {
    if (!open) return;
    setScale(1);
    setOffset({ x: 0, y: 0 });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Non-passive wheel — zoom toward cursor
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  return (
    <>
      <SkeletonImage
        src={src}
        alt={alt || ""}
        {...props}
        className="cursor-zoom-in"
        onClick={() => setOpen(true)}
      />
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-[95vw] h-[95vh] rounded-lg shadow-2xl flex flex-col"
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
                onClick={() => setOpen(false)}
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
              <img
                src={src}
                alt={alt || ""}
                draggable={false}
                className="max-w-full max-h-full object-contain transition-transform"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transformOrigin: "center center",
                  transitionDuration: isDragging || isZooming ? "0ms" : "120ms",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
