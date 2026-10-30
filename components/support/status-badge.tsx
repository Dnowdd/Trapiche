import { cn } from "@/lib/utils";
import { TICKET_STATUS, type TicketStatusId } from "@/lib/support";

const TONE: Record<TicketStatusId, string> = {
  OPEN: "bg-(--yellow-soft) text-(--ink-2) border-(--yellow-deep)",
  ANSWERED: "bg-[#e3eccb] text-[#3d5a1c] border-[#cddbb0]",
  CLOSED: "bg-[rgba(67,62,18,0.06)] text-(--ink-4) border-transparent",
};

export default function StatusBadge({
  status,
  staffView = false,
  className,
}: {
  status: TicketStatusId;
  staffView?: boolean;
  className?: string;
}) {
  const label =
    staffView && status === "OPEN"
      ? "Aguardando resposta"
      : staffView && status === "ANSWERED"
        ? "Aguardando usuário"
        : TICKET_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border font-mono text-[10px] uppercase tracking-[0.06em] whitespace-nowrap",
        TONE[status],
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
