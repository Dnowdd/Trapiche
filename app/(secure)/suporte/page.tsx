import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getMyTickets } from "@/lib/queries/support";
import SupportShell from "@/components/support/shell";
import TicketRow from "@/components/support/ticket-row";

export const metadata: Metadata = { title: "Suporte" };

export default async function SupportPage() {
  const session = await requireSession();
  const tickets = await getMyTickets(session.user.id);

  return (
    <SupportShell
      eyebrow="Ajuda"
      title="Suporte"
      aside={
        <Link
          href="/suporte/novo"
          className="h-10.5 px-4.5 rounded-[10px] bg-(--ink-2) text-(--yellow) text-[13px] font-semibold inline-flex items-center gap-2 self-start sm:self-auto hover:bg-(--ink)"
        >
          + Novo ticket
        </Link>
      }
    >
      <p className="m-0 -mt-2 mb-6 text-[14px] text-(--ink-3) max-w-140 leading-[1.55]">
        Achou um problema, um livro com dado errado ou tem uma ideia? Abra um
        ticket e converse direto com a gente por aqui.
      </p>
      {tickets.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[rgba(67,62,18,0.2)] py-14 px-6 text-center">
          <div className="text-[16px] font-bold text-(--ink)">
            Nenhum ticket ainda
          </div>
          <p className="m-0 mt-1.5 text-[13px] text-(--ink-4)">
            Quando você abrir um, a conversa aparece aqui.
          </p>
          <Link
            href="/suporte/novo"
            className="mt-5 h-10 px-4 rounded-[10px] bg-(--yellow) border border-(--yellow-deep) text-(--ink) text-[13px] font-semibold inline-flex items-center hover:bg-(--yellow-deep)"
          >
            Abrir um ticket
          </Link>
        </div>
      ) : (
        <div className="rounded-[18px] border border-[rgba(67,62,18,0.1)] bg-(--cream-card) overflow-hidden">
          {tickets.map((t) => (
            <TicketRow key={t.id} t={t} href={`/suporte/${t.id}`} />
          ))}
        </div>
      )}
    </SupportShell>
  );
}
