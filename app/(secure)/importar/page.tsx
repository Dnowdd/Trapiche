import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { getImportHistory } from "@/lib/queries/import";
import Importer from "./importer";

export const metadata: Metadata = {
  title: "Importar livros",
  robots: { index: false },
};

export default async function ImportPage() {
  const session = await requireSession();
  const history = await getImportHistory(session.user.id);
  const running = history.find((h) => h.status === "RUNNING") ?? null;

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="pt-7 md:pt-10 px-4 sm:px-8 lg:px-18.75 pb-12 md:pb-15">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase">
          Sua estante
        </div>
        <h1 className="m-0 mt-2 text-[28px] md:text-[40px] font-extrabold tracking-[-0.03em] leading-[1.05] text-(--ink)">
          Traga sua estante de outro lugar
        </h1>
        <p className="m-0 mt-3 max-w-150 text-[15px] leading-[1.6] text-(--ink-3)">
          Importe do Goodreads, do Skoob ou de qualquer planilha. A gente
          encontra cada livro, coloca na estante certa, traz suas notas, as
          datas de leitura e transforma suas prateleiras em tags.
        </p>
        <Importer
          handle={session.user.handle as string}
          running={running}
          history={history.filter((h) => h.status !== "RUNNING")}
        />
      </div>
    </div>
  );
}
