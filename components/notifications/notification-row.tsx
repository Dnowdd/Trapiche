import Link from "next/link";
import type { NotificationItem } from "@/lib/queries/notifications";

export default function NotificationRow({ n }: { n: NotificationItem }) {
  return (
    <li>
      <Link
        href={n.href}
        className="flex gap-3 px-3 py-2.5 rounded-[8px] hover:bg-[rgba(67,62,18,0.06)]"
      >
        <span className="w-8 h-8 shrink-0 rounded-full bg-(--cream-deep) border border-(--ink-3) flex items-center justify-center text-[11px] font-bold text-(--ink-2)">
          {n.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] text-(--ink-3) leading-snug">
            <strong className="font-semibold text-(--ink)">{n.actor}</strong>{" "}
            {n.text}
          </span>
          <span className="block mt-0.5 font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase">
            {n.when}
          </span>
        </span>
        {n.unread && (
          <span
            aria-label="Não lida"
            className="mt-1.5 w-2 h-2 shrink-0 rounded-full bg-(--ink-2)"
          />
        )}
      </Link>
    </li>
  );
}
