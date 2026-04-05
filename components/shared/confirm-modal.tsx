"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  /** 이 값이 주어지면 유저가 동일한 텍스트를 입력해야 확인 버튼 활성화 */
  requiredInput?: string;
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "삭제",
  cancelText = "취소",
  loading = false,
  requiredInput,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!open) {
      setInputValue("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

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

  if (!open) return null;

  const isConfirmDisabled =
    loading || (requiredInput !== undefined && inputValue !== requiredInput);

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-card border border-black/10 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-[#dcddde]/50 mb-4">{description}</p>
        )}

        {requiredInput !== undefined && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-[#dcddde]/70 mb-2">
              계속하려면 아래 텍스트를 입력해주세요.
            </p>
            <p className="text-sm font-mono font-semibold text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mb-3 select-all">
              {requiredInput}
            </p>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="위 텍스트를 입력해주세요"
              className="w-full h-10 px-3 rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-sm text-gray-900 dark:text-[#dcddde] placeholder:text-gray-400 dark:placeholder:text-[#dcddde]/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/30 transition-colors"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 rounded-lg text-sm font-medium text-gray-600 dark:text-[#dcddde]/70 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className="h-9 px-4 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? "처리 중..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
