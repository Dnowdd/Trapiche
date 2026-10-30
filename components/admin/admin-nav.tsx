"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/suporte", label: "Tickets" },
  { href: "/admin/denuncias", label: "Denúncias" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Administração"
      className="mx-2 md:mx-3.75 mb-2 px-4 sm:px-8 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]"
    >
      <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.1em] text-(--ink-3) whitespace-nowrap">
        Admin
      </span>
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "h-8 px-3.5 rounded-full text-[12.5px] font-semibold inline-flex items-center whitespace-nowrap transition-colors",
              active
                ? "bg-(--ink-2) text-(--yellow)"
                : "text-(--ink-2) hover:bg-(--yellow-soft)",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
