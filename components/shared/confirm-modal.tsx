"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Input } from "@/components/ds";

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
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!open) {
      setInputValue("");
    }
  }, [open]);

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

  const isConfirmDisabled =
    loading || (requiredInput !== undefined && inputValue !== requiredInput);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
    >
      {requiredInput !== undefined && (
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-[#dcddde]/70 mb-2">
            계속하려면 아래 텍스트를 입력해주세요.
          </p>
          <p className="text-sm font-mono font-semibold text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mb-3 select-all">
            {requiredInput}
          </p>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="위 텍스트를 입력해주세요"
            autoFocus
          />
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={isConfirmDisabled}
          loading={loading}
        >
          {loading ? "처리 중..." : confirmText}
        </Button>
      </div>
    </Modal>
  );
}
