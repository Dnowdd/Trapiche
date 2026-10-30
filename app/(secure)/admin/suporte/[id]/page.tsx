import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { isAdmin } from "@/lib/queries/reports";
import { getTicket, markTicketRead } from "@/lib/queries/support";
import { fmtJoined } from "@/lib/dates";
import { TICKET_CATEGORIES } from "@/lib/support";
import Avatar from "@/components/shared/avatar";
import SupportShell from "@/components/support/shell";
import ChatThread from "@/components/support/chat-thread";

export const metadata: Metadata = { title: "Ticket de suporte" };

export default async function StaffTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  if (!(await isAdmin(session.user.id))) notFound();
  const ticket = await getTicket(id);
  if (!ticket) notFound();
  const staff = ticket.user.id !== session.user.id;
  await markTicketRead(ticket.id, session.user.id, staff);
  const u = ticket.user;

  return (
    <SupportShell
      eyebrow={`Ticket #${ticket.number} · ${TICKET_CATEGORIES[ticket.category]} · aberto em ${ticket.opened}`}
      title={ticket.subject}
      back={{ href: "/admin/suporte", label: "Tickets" }}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] items-start">
        <ChatThread
          ticketId={ticket.id}
          initialMessages={ticket.messages}
          initialStatus={ticket.status}
          viewerId={session.user.id}
          staffView={staff}
        />
        <aside className="rounded-[18px] border border-[rgba(67,62,18,0.1)] bg-(--cream-card) p-5 lg:sticky lg:top-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mb-3">
            Quem abriu
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={u.name} image={u.image} size={44} />
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-(--ink) truncate">
                {u.name}
              </div>
              <Link
                href={`/u/${u.handle}`}
                className="font-mono text-[11px] text-(--ink-4) hover:text-(--ink-2)"
              >
                @{u.handle}
              </Link>
            </div>
          </div>
          <dl className="m-0 mt-4 flex flex-col gap-2.5 text-[12px]">
            <div>
              <dt className="text-(--ink-4)">E-mail</dt>
              <dd className="m-0 text-(--ink-2) break-all">{u.email}</dd>
            </div>
            <div>
              <dt className="text-(--ink-4)">Conta criada</dt>
              <dd className="m-0 text-(--ink-2)">{fmtJoined(u.createdAt)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </SupportShell>
  );
}
