"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/actions/post";
import { toast } from "sonner";

const HOLD_DURATION = 400;

export function DeletePostButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const rafRef = useRef<number>();
  const startTimeRef = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 바깥 클릭 시 취소
  useEffect(() => {
    if (!confirming) return;
    function handleClickOutside(e: MouseEvent) {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setConfirming(false);
        setProgress(0);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [confirming]);

  // 첫 클릭 → confirming 모드, 4초 후 자동 해제
  useEffect(() => {
    if (confirming && !holding) {
      timerRef.current = setTimeout(() => {
        setConfirming(false);
        setProgress(0);
      }, 4000);
    }
    return () => clearTimeout(timerRef.current);
  }, [confirming, holding]);

  const doDelete = useCallback(() => {
    startTransition(async () => {
      const result = await deletePost(postId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("글이 삭제되었습니다");
        router.push("/");
        router.refresh();
      }
      setConfirming(false);
      setHolding(false);
      setProgress(0);
    });
  }, [postId, router]);

  // 게이지 애니메이션
  const animateProgress = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const p = Math.min(elapsed / HOLD_DURATION, 1);
    setProgress(p);

    if (p >= 1) {
      setHolding(false);
      doDelete();
      return;
    }
    rafRef.current = requestAnimationFrame(animateProgress);
  }, [doDelete]);

  function handleFirstClick() {
    if (!confirming) {
      setConfirming(true);
    }
  }

  function startHold() {
    if (!confirming || isPending) return;
    clearTimeout(timerRef.current);
    setHolding(true);
    setProgress(0);
    startTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(animateProgress);
  }

  function cancelHold() {
    if (!holding) return;
    cancelAnimationFrame(rafRef.current!);
    setHolding(false);
    setProgress(0);
  }

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current!);
  }, []);

  return (
    <button
      ref={buttonRef}
      onClick={handleFirstClick}
      onMouseDown={confirming ? startHold : undefined}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={confirming ? startHold : undefined}
      onTouchEnd={cancelHold}
      disabled={isPending}
      className={`
        inline-flex items-center justify-center h-9 rounded-lg overflow-hidden leading-none box-border
        transition-all duration-300 ease-in-out select-none relative
        ${confirming
          ? "pl-2.5 pr-3 bg-red-500/10 text-red-500 border border-red-500/20 z-[60]"
          : "w-9 text-slate-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent"
        }
        ${isPending ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {/* 게이지 배경 */}
      {confirming && (
        <div
          className="absolute inset-0 bg-red-500/20 origin-left transition-none pointer-events-none"
          style={{ transform: `scaleX(${progress})` }}
        />
      )}

      {/* 아이콘 */}
      {isPending ? (
        <span className="relative z-10 size-[18px] border-2 border-red-300 border-t-red-500 rounded-full animate-spin block shrink-0" />
      ) : (
        <span className="material-symbols-outlined relative z-10 shrink-0 flex items-center justify-center" style={{ fontSize: 18, width: 18, height: 18 }}>delete</span>
      )}

      {/* 텍스트 */}
      <span
        className="relative z-10 text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxWidth: confirming ? 120 : 0,
          opacity: confirming ? 1 : 0,
          marginLeft: confirming ? 6 : 0,
        }}
      >
        {holding ? "삭제 중..." : "꾹 눌러 삭제"}
      </span>
    </button>
  );
}
