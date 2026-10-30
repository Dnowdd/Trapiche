"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Phase = "idle" | "loading" | "done";

function Bar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("idle");
  const route = `${pathname}?${searchParams}`;
  const last = useRef(route);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download"))
        return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname.startsWith("/api/")) return;
      if (url.pathname === location.pathname && url.search === location.search)
        return;
      setPhase("loading");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (last.current === route) return;
    last.current = route;
    setPhase((p) => (p === "loading" ? "done" : p));
  }, [route]);

  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => setPhase("idle"), 400);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-100 h-0.75 pointer-events-none"
    >
      <div
        data-phase={phase}
        className="h-full bg-(--ink-2) origin-left shadow-[0_0_10px_rgba(67,62,18,0.35)] scale-x-0 opacity-0 data-[phase=loading]:opacity-100 data-[phase=loading]:scale-x-[0.85] data-[phase=loading]:transition-transform data-[phase=loading]:duration-[8s] data-[phase=loading]:ease-[cubic-bezier(0.05,0.8,0.2,1)] data-[phase=done]:scale-x-100 data-[phase=done]:opacity-0 data-[phase=done]:transition-[transform,opacity] data-[phase=done]:duration-300"
      />
    </div>
  );
}

export default function NavigationProgress() {
  return (
    <Suspense>
      <Bar />
    </Suspense>
  );
}
