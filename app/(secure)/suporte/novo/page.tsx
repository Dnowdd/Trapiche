import type { Metadata } from "next";
import SupportShell from "@/components/support/shell";
import NewTicketForm from "@/components/support/new-ticket-form";

export const metadata: Metadata = { title: "Novo ticket" };

export default function NewTicketPage() {
  return (
    <SupportShell
      eyebrow="Suporte"
      title="Abrir um ticket"
      back={{ href: "/suporte", label: "Meus tickets" }}
    >
      <div className="max-w-160">
        <NewTicketForm />
      </div>
    </SupportShell>
  );
}
