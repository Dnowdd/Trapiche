"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string };

const listeners = new Set<(t: Toast) => void>();
let seq = 0;

export function toast(message: string) {
  const t = { id: ++seq, message };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const add = (t: Toast) => {
      setItems((prev) => [...prev, t]);
      setTimeout(
        () => setItems((prev) => prev.filter((x) => x.id !== t.id)),
        4000,
      );
    };
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 flex flex-col gap-2 items-center pointer-events-none"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto max-w-105 px-4.5 py-3 rounded-[12px] bg-(--ink-2) text-(--cream) text-[13px] leading-normal shadow-[0_16px_40px_-12px_rgba(67,62,18,0.5)] animate-[modeIn_0.25s_cubic-bezier(0.2,0.7,0.2,1)]"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
