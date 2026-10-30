import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { isAdmin } from "@/lib/queries/reports";
import { getStaffCounts, getStaffTickets } from "@/lib/queries/support";
import SupportShell from "@/components/support/shell";
import TicketRow from "@/components/support/ticket-row";

export const metadata: Metadata = { title: "Tickets de suporte" };

const TABS = [
  { status: "OPEN", label: "Aguardando resposta" },
  { status: "ANSWERED", label: "Aguardando usuário" },
  { status: "CLOSED", label: "Fechados" },
] as const;

export default async function StaffSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  if (!(await isAdmin(session.user.id))) notFound();
  const { status: raw } = await searchParams;
  const status = TABS.find((t) => t.status === raw)?.status ?? "OPEN";
  const [tickets, counts] = await Promise.all([
    getStaffTickets(status),
    getStaffCounts(),
  ]);

  return (
    <SupportShell eyebrow="Administração" title="Tickets de suporte">
      <nav className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <Link
            key={t.status}
            href={`/admin/suporte?status=${t.status}`}
            aria-current={t.status === status ? "page" : undefined}
            className="group h-9 px-4 inline-flex items-center gap-2 rounded-full border border-[rgba(67,62,18,0.15)] text-[13px] font-semibold text-(--ink-3) hover:bg-(--yellow-soft) aria-[current=page]:bg-(--ink-2) aria-[current=page]:text-(--yellow) aria-[current=page]:border-(--ink-2)"
          >
            {t.label}
            <span className="font-mono text-[10px] text-(--ink-5) group-aria-[current=page]:text-(--yellow-soft)">
              {counts[t.status]}
            </span>
          </Link>
        ))}
      </nav>
      {tickets.length === 0 ? (
        <p className="text-[14px] text-(--ink-3)">
          {status === "OPEN"
            ? "Nenhum ticket esperando resposta. Caixa zerada!"
            : "Nada por aqui."}
        </p>
      ) : (
        <div className="rounded-[18px] border border-[rgba(67,62,18,0.1)] bg-(--cream-card) overflow-hidden">
          {tickets.map((t) => (
            <TicketRow
              key={t.id}
              t={t}
              href={`/admin/suporte/${t.id}`}
              staffView
            />
          ))}
        </div>
      )}
    </SupportShell>
  );
}
