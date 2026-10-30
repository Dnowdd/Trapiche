import Link from "next/link";
import Avatar from "@/components/shared/avatar";
import { TICKET_CATEGORIES, type TicketCategoryId } from "@/lib/support";
import type { StaffTicketSummary, TicketSummary } from "@/lib/queries/support";
import StatusBadge from "./status-badge";

export default function TicketRow({
  t,
  href,
  staffView = false,
}: {
  t: TicketSummary & Partial<Pick<StaffTicketSummary, "user" | "preview">>;
  href: string;
  staffView?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex gap-3.5 items-start px-4 sm:px-5 py-4 border-b border-(--rule) last:border-b-0 transition-colors duration-150 hover:bg-(--yellow-soft)"
    >
      {t.user ? (
        <Avatar
          name={t.user.name}
          image={t.user.image}
          size={36}
          className="border"
        />
      ) : (
        <span className="mt-0.5 w-9 h-9 shrink-0 rounded-full bg-(--cream-deep) flex items-center justify-center font-mono text-[11px] font-semibold text-(--ink-3)">
          #{t.number}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {t.unread && (
            <span
              aria-label="Mensagem nova"
              className="w-2 h-2 rounded-full bg-[#c4552b] shrink-0"
            />
          )}
          <span
            className={`text-[15px] tracking-[-0.005em] text-(--ink) truncate ${t.unread ? "font-bold" : "font-semibold"}`}
          >
            {t.subject}
          </span>
        </div>
        <div className="mt-1 font-mono text-[10.5px] text-(--ink-4) tracking-[0.03em] flex gap-x-2 gap-y-0.5 flex-wrap">
          {t.user && (
            <>
              <span className="text-(--ink-3)">
                #{t.number} · @{t.user.handle}
              </span>
              <span>·</span>
            </>
          )}
          <span>{TICKET_CATEGORIES[t.category as TicketCategoryId]}</span>
          <span>·</span>
          <span>
            {t.messages} {t.messages === 1 ? "mensagem" : "mensagens"}
          </span>
          <span>·</span>
          <span>{t.updated}</span>
        </div>
        {t.preview && (
          <p className="m-0 mt-1.5 text-[13px] text-(--ink-3) line-clamp-1">
            {t.preview}
          </p>
        )}
      </div>
      <StatusBadge
        status={t.status}
        staffView={staffView}
        className="hidden sm:inline-flex"
      />
    </Link>
  );
}
