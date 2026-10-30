import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getTicket, markTicketRead } from "@/lib/queries/support";
import { TICKET_CATEGORIES } from "@/lib/support";
import SupportShell from "@/components/support/shell";
import ChatThread from "@/components/support/chat-thread";

export const metadata: Metadata = { title: "Ticket de suporte" };

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const ticket = await getTicket(id);
  if (!ticket || ticket.user.id !== session.user.id) notFound();
  await markTicketRead(ticket.id, session.user.id, false);

  return (
    <SupportShell
      eyebrow={`Ticket #${ticket.number} · ${TICKET_CATEGORIES[ticket.category]} · aberto em ${ticket.opened}`}
      title={ticket.subject}
      back={{ href: "/suporte", label: "Meus tickets" }}
    >
      <ChatThread
        ticketId={ticket.id}
        initialMessages={ticket.messages}
        initialStatus={ticket.status}
        viewerId={session.user.id}
        staffView={false}
      />
    </SupportShell>
  );
}
