"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import { getCroppedImg, type CropArea } from "@/lib/crop-image";

type ImageCropModalProps = {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (blob: Blob) => void;
  aspect?: number;
  title?: string;
  sizeLabel?: string;
  outputSize?: { width: number; height: number };
  cropShape?: "rect" | "round";
};

export function ImageCropModal({
  open,
  imageSrc,
  onClose,
  onConfirm,
  aspect = 1200 / 630,
  title = "표지 이미지 자르기",
  sizeLabel = "1200 × 630",
  outputSize = { width: 1200, height: 630 },
  cropShape = "rect",
}: ImageCropModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback(
    (_croppedArea: CropArea, croppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setIsProcessing(false);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, outputSize);
      onConfirm(blob);
    } catch {
      setIsProcessing(false);
    }
  }, [imageSrc, croppedAreaPixels, onConfirm, outputSize]);

  if (!open || !imageSrc) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-card border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          <span className="text-[11px] text-slate-500">{sizeLabel}</span>
        </div>

        {/* Cropper area */}
        <div className="relative w-full" style={{ height: 380 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-black/[0.06] dark:border-white/[0.06]">
          <span className="material-symbols-outlined text-[16px] text-slate-500">
            photo_size_select_small
          </span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1 accent-primary bg-black/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="material-symbols-outlined text-[16px] text-slate-500">
            photo_size_select_large
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end px-5 py-3 border-t border-black/[0.06] dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="h-9 px-4 rounded-lg text-sm font-medium text-gray-500 dark:text-[#dcddde]/70 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || !croppedAreaPixels}
            className="h-9 px-4 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isProcessing ? "처리 중..." : "적용"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
