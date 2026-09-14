"use client";

import { useRef, useState } from "react";

const LONG_PRESS_MS = 500;

export function HomeRecipePreview({
  src,
  title,
}: {
  src: string | null;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  function clearTimer() {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function startPress() {
    if (!src) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setOpen(true);
    }, LONG_PRESS_MS);
  }

  return (
    <>
      <div
        className="select-none touch-manipulation"
        style={{ WebkitTouchCallout: "none" }}
        onPointerDown={startPress}
        onPointerUp={clearTimer}
        onPointerCancel={clearTimer}
        onPointerLeave={clearTimer}
        onContextMenu={(event) => {
          if (src) event.preventDefault();
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={title}
            className="h-24 w-24 rounded-xl object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-white text-xs text-[#1B6B32]">
            写真なし
          </div>
        )}
      </div>
      {open && src ? (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          aria-label="拡大を閉じる"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={title}
            className="max-h-[90vh] max-w-full rounded-2xl object-contain"
          />
        </button>
      ) : null}
    </>
  );
}
