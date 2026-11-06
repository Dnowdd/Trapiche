"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "system" | "light" | "dark";
const KEY = "trapiche-theme";
const listeners = new Set<() => void>();

function read(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {}
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  listeners.forEach((l) => l());
}

const OPTIONS: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "system", label: "Tema do sistema", icon: Monitor },
  { id: "light", label: "Tema claro", icon: Sun },
  { id: "dark", label: "Tema escuro", icon: Moon },
];

export default function ThemeToggle() {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => "system" as Theme,
  );

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="inline-flex p-0.75 rounded-full border border-(--yellow-deep) bg-[rgba(var(--ink-rgb),0.04)]"
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={theme === id}
          aria-label={label}
          title={label}
          onClick={() => apply(id)}
          className={cn(
            "size-7 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-120",
            theme === id
              ? "bg-(--ink-2) text-(--yellow)"
              : "text-(--ink-3) hover:text-(--ink)",
          )}
        >
          <Icon size={14} strokeWidth={2.2} aria-hidden />
        </button>
      ))}
    </div>
  );
}
