"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  { id: "system", label: "Igual ao sistema", icon: Monitor },
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Escuro", icon: Moon },
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
  const current = OPTIONS.find((o) => o.id === theme)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Tema: ${current.label.toLowerCase()}`}
        title="Tema"
        className="size-9 rounded-full flex items-center justify-center text-(--ink-2) cursor-pointer transition-colors hover:bg-[rgba(var(--ink-rgb),0.08)] data-[popup-open]:bg-[rgba(var(--ink-rgb),0.08)]"
      >
        <current.icon size={17} strokeWidth={2.1} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="min-w-48 p-1.5 rounded-[12px] bg-(--cream) border border-[rgba(var(--ink-rgb),0.10)] shadow-[0_16px_40px_-8px_rgba(var(--shadow-rgb),0.22),0_2px_8px_-2px_rgba(var(--shadow-rgb),0.10)]"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 pt-1.5 pb-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-(--ink-4)">
            Tema
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(v) => apply(v as Theme)}
          >
            {OPTIONS.map(({ id, label, icon: Icon }) => (
              <DropdownMenuRadioItem
                key={id}
                value={id}
                className="gap-2.5 cursor-pointer px-3 py-2 text-[13px] text-(--ink-2) rounded-[8px] focus:bg-[rgba(var(--ink-rgb),0.06)] focus:text-(--ink-2)"
              >
                <Icon size={14} aria-hidden />
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
