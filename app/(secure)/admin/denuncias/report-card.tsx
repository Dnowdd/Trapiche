"use client";

import Link from "next/link";
import { Button } from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { resolveReport, restoreContent } from "@/lib/actions/reports";
import type { ReportItem } from "@/lib/queries/reports";

export default function ReportCard({
  report: r,
  status,
}: {
  report: ReportItem;
  status: "OPEN" | "HIDDEN" | "DISMISSED";
}) {
  const { pending, run } = useAction();
  const act = (fn: () => ReturnType<typeof resolveReport>, done: string) =>
    run(fn, () => toast(done), toast);

  return (
    <article className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[16px] py-5 px-6">
      <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-2 flex flex-wrap gap-x-2">
        <span>{r.kind === "review" ? "Resenha" : "Comentário"}</span>
        {r.author && (
          <>
            <span>·</span>
            <Link
              href={`/u/${r.author.handle}`}
              className="hover:text-(--ink-2)"
            >
              {r.author.name} (@{r.author.handle})
            </Link>
          </>
        )}
        {r.book && (
          <>
            <span>·</span>
            <Link href={`/book/${r.book.id}`} className="hover:text-(--ink-2)">
              {r.book.title}
            </Link>
          </>
        )}
        {r.spoiler && (
          <>
            <span>·</span>
            <span>marcada como spoiler</span>
          </>
        )}
      </div>
      <p className="m-0 mb-4 text-[14px] leading-[1.6] text-(--ink-2) whitespace-pre-line">
        {r.text || "Sem texto."}
      </p>
      <ul className="m-0 mb-4 p-0 list-none flex flex-col gap-1.5 border-t border-(--rule) pt-3">
        {r.reasons.map((x, i) => (
          <li key={i} className="text-[12px] text-(--ink-3)">
            <strong className="text-(--ink-2)">{x.reason}</strong> · por @
            {x.by.handle} · {x.when}
          </li>
        ))}
      </ul>
      <div className="flex gap-2 justify-end">
        {status === "OPEN" && (
          <>
            <Button
              variant="ghost"
              className="h-9"
              loading={pending}
              onClick={() =>
                act(
                  () => resolveReport(r.id, "dismiss"),
                  "Denúncia descartada.",
                )
              }
            >
              Descartar
            </Button>
            <Button
              variant="danger"
              className="h-9"
              loading={pending}
              onClick={() =>
                act(() => resolveReport(r.id, "hide"), "Conteúdo ocultado.")
              }
            >
              Ocultar conteúdo
            </Button>
          </>
        )}
        {status === "HIDDEN" && (
          <Button
            variant="ghost"
            className="h-9"
            loading={pending}
            onClick={() =>
              act(() => restoreContent(r.id), "Conteúdo restaurado.")
            }
          >
            Restaurar conteúdo
          </Button>
        )}
      </div>
    </article>
  );
}
