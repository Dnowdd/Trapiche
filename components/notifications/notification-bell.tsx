"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  loadNotifications,
  markNotificationsRead,
} from "@/lib/actions/notifications";
import type { NotificationItem } from "@/lib/queries/notifications";
import NotificationRow from "./notification-row";

const POLL_MS = 60_000;

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    const res = await loadNotifications(10).catch(() => null);
    if (res?.ok && res.data) {
      setItems(res.data.items);
      setUnread(res.data.unread);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh]);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unread > 0) {
          setUnread(0);
          markNotificationsRead().catch(() => null);
        }
      }}
    >
      <DropdownMenuTrigger
        aria-label={
          unread ? `Notificações, ${unread} não lidas` : "Notificações"
        }
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-(--ink-2) cursor-pointer outline-none transition-[background] duration-150 hover:bg-[rgba(67,62,18,0.06)]"
      >
        <Bell className="w-4.5 h-4.5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-(--ink-2) text-(--yellow) text-[10px] font-bold leading-4 text-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-80 max-w-[calc(100vw-24px)] p-1.5 rounded-[12px] bg-(--cream) border border-[rgba(67,62,18,0.10)] shadow-[0_16px_40px_-8px_rgba(67,62,18,0.22),0_2px_8px_-2px_rgba(67,62,18,0.10)]"
      >
        <div className="px-3 pt-2 pb-1.5 font-mono text-[10px] text-(--ink-4) tracking-[0.08em] uppercase">
          Notificações
        </div>
        {items === null ? (
          <div className="px-3 py-4 text-[13px] text-(--ink-4)">
            Carregando…
          </div>
        ) : items.length === 0 ? (
          <div className="px-3 py-4 text-[13px] text-(--ink-4)">
            Nada por aqui ainda. Quando alguém curtir ou comentar suas resenhas,
            aparece aqui.
          </div>
        ) : (
          <ul className="m-0 p-0 list-none max-h-96 overflow-y-auto">
            {items.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </ul>
        )}
        <Link
          href="/notificacoes"
          className="block mt-1 px-3 py-2 rounded-[8px] text-[12px] font-medium text-(--ink-2) hover:bg-[rgba(67,62,18,0.06)]"
        >
          Ver todas
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
