"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileUp, Download, Search } from "lucide-react";
import { Button, FormError } from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { cancelImport, processImport, startImport } from "@/lib/actions/import";
import {
  mapRows,
  parseCsv,
  TEMPLATE_CSV,
  type ParsedRow,
} from "@/lib/import/csv";
import type { ImportState } from "@/lib/queries/import";
import { cn } from "@/lib/utils";

const SOURCE_LABEL = {
  GOODREADS: "Goodreads",
  SKOOB: "Skoob",
  CSV: "Planilha",
} as const;

const SHELF_LABEL: Record<NonNullable<ParsedRow["shelf"]>, string> = {
  READ: "Lidos",
  READING: "Lendo",
  WANT: "Quero ler",
  REREADING: "Relendo",
  ABANDONED: "Abandonados",
};

function Steps() {
  const steps = [
    {
      title: "Goodreads",
      body: (
        <>
          Em <em>My Books</em>, abra <em>Import and export</em> e clique em{" "}
          <em>Export Library</em>. Baixe o CSV quando ficar pronto.
        </>
      ),
    },
    {
      title: "Skoob",
      body: (
        <>
          Exporte sua estante para uma planilha (CSV) com colunas como{" "}
          <em>título</em>, <em>autor</em>, <em>ISBN</em> e <em>estante</em>.
        </>
      ),
    },
    {
      title: "Qualquer planilha",
      body: (
        <>
          Salve como CSV com pelo menos a coluna <em>título</em>. Use nosso
          modelo se quiser.
        </>
      ),
    },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {steps.map((s, i) => (
        <div
          key={s.title}
          className="rounded-[14px] bg-(--cream-card) border border-[rgba(67,62,18,0.08)] p-4"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
            0{i + 1}
          </div>
          <div className="mt-1 text-[14px] font-bold text-(--ink)">
            {s.title}
          </div>
          <p className="m-0 mt-1 text-[12.5px] leading-normal text-(--ink-3)">
            {s.body}
          </p>
        </div>
      ))}
    </div>
  );
}

function Stat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone?: "warn";
}) {
  return (
    <div className="rounded-[12px] bg-(--cream-card) border border-[rgba(67,62,18,0.08)] px-4 py-3">
      <div
        className={cn(
          "text-[24px] font-extrabold tracking-[-0.02em] tabular-nums leading-none",
          tone === "warn" ? "text-[#9a4a2a]" : "text-(--ink)",
        )}
      >
        {value.toLocaleString("pt-BR")}
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-(--ink-4)">
        {label}
      </div>
    </div>
  );
}

function Progress({
  state,
  handle,
  onCancel,
  canceling,
}: {
  state: ImportState;
  handle: string;
  onCancel?: () => void;
  canceling?: boolean;
}) {
  const pct = state.total ? Math.round((state.done / state.total) * 100) : 0;
  const running = state.status === "RUNNING";
  return (
    <section className="mt-8 rounded-[20px] border border-[rgba(67,62,18,0.1)] bg-(--cream) overflow-hidden">
      <div className="bg-(--ink-2) text-(--cream) px-5 sm:px-6 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--yellow) opacity-80">
              {SOURCE_LABEL[state.source]}
              {state.fileName ? ` · ${state.fileName}` : ""}
            </div>
            <div className="mt-1 text-[20px] font-bold">
              {running
                ? "Trazendo seus livros…"
                : state.status === "CANCELED"
                  ? "Importação interrompida"
                  : "Importação concluída"}
            </div>
          </div>
          <div className="text-[30px] font-extrabold tabular-nums text-(--yellow)">
            {pct}%
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-[rgba(255,248,213,0.14)] overflow-hidden">
          <div
            className="h-full rounded-full bg-(--yellow) transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 font-mono text-[10.5px] text-(--cream-deep) tracking-[0.04em]">
          {state.done.toLocaleString("pt-BR")} de{" "}
          {state.total.toLocaleString("pt-BR")} livros processados
          {running ? " · pode deixar esta aba aberta" : ` · ${state.when}`}
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Stat value={state.imported} label="Na estante" />
          <Stat value={state.skipped} label="Já estavam" />
          <Stat value={state.notFound} label="Não achados" tone="warn" />
          <Stat value={state.failed} label="Com erro" tone="warn" />
        </div>
        {state.problems.length > 0 && !running && (
          <div className="mt-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mb-2">
              Esses ficaram de fora · adicione pela busca
            </div>
            <ul className="m-0 p-0 list-none max-h-80 overflow-y-auto rounded-[12px] border border-[rgba(67,62,18,0.08)] divide-y divide-(--rule)">
              {state.problems.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold text-(--ink-2) truncate">
                      {p.title}
                    </div>
                    <div className="text-[11.5px] text-(--ink-4) truncate">
                      {[p.author, p.isbn && `ISBN ${p.isbn}`]
                        .filter(Boolean)
                        .join(" · ") || "sem autor"}
                    </div>
                  </div>
                  <Link
                    href={`/search?q=${encodeURIComponent(p.isbn ?? [p.title, p.author].filter(Boolean).join(" "))}`}
                    target="_blank"
                    className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[rgba(67,62,18,0.18)] text-[12px] text-(--ink-2) hover:bg-(--yellow-soft)"
                  >
                    <Search size={13} /> Buscar
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2.5 justify-end">
          {running && onCancel && (
            <Button variant="ghost" loading={canceling} onClick={onCancel}>
              Parar importação
            </Button>
          )}
          {!running && (
            <Link
              href={`/u/${handle}?tab=estante`}
              className="h-11 px-5 rounded-[12px] bg-(--ink-2) text-(--yellow) text-[14px] font-semibold inline-flex items-center hover:bg-(--ink)"
            >
              Ver minha estante →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Importer({
  handle,
  running,
  history,
}: {
  handle: string;
  running: ImportState | null;
  history: ImportState[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ReturnType<typeof mapRows> | null>(
    null,
  );
  const [error, setError] = useState("");
  const [state, setState] = useState<ImportState | null>(running);
  const [starting, setStarting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [dragging, setDragging] = useState(false);
  const loop = useRef(false);

  const pick = async (f: File | undefined) => {
    setError("");
    setPreview(null);
    setFile(null);
    if (!f) return;
    if (!/\.(csv|tsv|txt)$/i.test(f.name))
      return setError("Envie um arquivo .csv.");
    const parsed = mapRows(parseCsv(await f.text()));
    if (parsed.missingTitle)
      return setError(
        "Não achamos a coluna de título nesse arquivo. Confira o modelo.",
      );
    if (!parsed.rows.length) return setError("Esse arquivo não tem livros.");
    setFile(f);
    setPreview(parsed);
  };

  const run = useCallback(async (jobId: string) => {
    if (loop.current) return;
    loop.current = true;
    try {
      for (;;) {
        const res = await processImport(jobId);
        if (!res.ok || !res.data) {
          toast(res.ok ? "Algo deu errado." : res.error);
          break;
        }
        setState(res.data);
        if (res.data.status !== "RUNNING") break;
      }
    } finally {
      loop.current = false;
    }
  }, []);

  useEffect(() => {
    if (running) void run(running.id);
  }, [running, run]);

  const start = async () => {
    if (!file) return;
    setStarting(true);
    const form = new FormData();
    form.set("file", file);
    const res = await startImport(form);
    setStarting(false);
    if (!res.ok || !res.data) return setError(res.ok ? "Erro." : res.error);
    setPreview(null);
    setFile(null);
    void run(res.data.id);
  };

  const cancel = async () => {
    if (!state) return;
    setCanceling(true);
    const res = await cancelImport(state.id);
    setCanceling(false);
    if (res.ok && res.data) setState(res.data);
  };

  if (state)
    return (
      <>
        <Progress
          state={state}
          handle={handle}
          onCancel={cancel}
          canceling={canceling}
        />
        {state.status !== "RUNNING" && (
          <button
            type="button"
            onClick={() => setState(null)}
            className="mt-4 text-[13px] text-(--ink-3) border-b border-(--ink-4) pb-px cursor-pointer hover:text-(--ink)"
          >
            Importar outro arquivo
          </button>
        )}
      </>
    );

  const counts = preview
    ? (Object.keys(SHELF_LABEL) as (keyof typeof SHELF_LABEL)[])
        .map((k) => ({
          label: SHELF_LABEL[k],
          n: preview.rows.filter((r) => (r.shelf ?? "WANT") === k).length,
        }))
        .filter((c) => c.n > 0)
    : [];
  const tagCount = preview
    ? new Set(preview.rows.flatMap((r) => r.tags)).size
    : 0;
  const rated = preview ? preview.rows.filter((r) => r.rating).length : 0;

  return (
    <div className="mt-8 flex flex-col gap-6">
      <Steps />
      <FormError message={error} />
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void pick(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex flex-col items-center justify-center text-center gap-3 rounded-[20px] border-2 border-dashed px-6 py-12 cursor-pointer transition-colors duration-150",
          dragging
            ? "border-(--ink-2) bg-(--yellow-soft)"
            : "border-[rgba(67,62,18,0.22)] hover:bg-(--yellow-soft)",
        )}
      >
        <span className="size-14 rounded-full bg-(--ink-2) text-(--yellow) flex items-center justify-center">
          <FileUp size={24} />
        </span>
        <span className="text-[16px] font-bold text-(--ink)">
          {file ? file.name : "Arraste o CSV aqui ou clique para escolher"}
        </span>
        <span className="text-[12.5px] text-(--ink-4)">
          Até 5.000 livros e 3,5 MB por arquivo.
        </span>
        <input
          type="file"
          accept=".csv,.tsv,.txt,text/csv"
          className="sr-only"
          onChange={(e) => void pick(e.target.files?.[0])}
        />
      </label>

      {preview && (
        <section className="rounded-[18px] bg-(--cream-card) border border-[rgba(67,62,18,0.1)] p-5 sm:p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
            Detectamos um arquivo do {SOURCE_LABEL[preview.source]}
          </div>
          <div className="mt-1 text-[22px] font-extrabold tracking-[-0.02em] text-(--ink)">
            {preview.rows.length.toLocaleString("pt-BR")}{" "}
            {preview.rows.length === 1 ? "livro" : "livros"} prontos para
            importar
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {counts.map((c) => (
              <span
                key={c.label}
                className="h-7 px-3 rounded-full bg-(--ink-2) text-(--yellow) text-[12px] font-semibold inline-flex items-center gap-1.5"
              >
                {c.label}
                <span className="font-mono text-[10px] text-(--yellow-soft)">
                  {c.n}
                </span>
              </span>
            ))}
            {rated > 0 && (
              <span className="h-7 px-3 rounded-full border border-[rgba(67,62,18,0.18)] text-[12px] text-(--ink-2) inline-flex items-center">
                {rated} com nota
              </span>
            )}
            {tagCount > 0 && (
              <span className="h-7 px-3 rounded-full border border-[rgba(67,62,18,0.18)] text-[12px] text-(--ink-2) inline-flex items-center">
                {tagCount}{" "}
                {tagCount === 1
                  ? "prateleira vira tag"
                  : "prateleiras viram tags"}
              </span>
            )}
          </div>
          <ul className="m-0 mt-4 p-0 list-none text-[13px] text-(--ink-3) divide-y divide-(--rule)">
            {preview.rows.slice(0, 5).map((r, i) => (
              <li key={i} className="py-2 flex justify-between gap-3">
                <span className="truncate">
                  <strong className="text-(--ink-2)">{r.title}</strong>
                  {r.author ? ` · ${r.author}` : ""}
                </span>
                <span className="shrink-0 font-mono text-[10.5px] text-(--ink-4)">
                  {SHELF_LABEL[r.shelf ?? "WANT"]}
                  {r.rating ? ` · ${r.rating}★` : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-4 text-[12.5px] text-(--ink-4) leading-normal">
            Livros que já estão na sua estante ficam como estão. Notas e
            resenhas importadas viram suas avaliações, e nada disso enche sua
            atividade recente.
          </p>
          <div className="mt-5 flex justify-end">
            <Button onClick={start} loading={starting}>
              Importar {preview.rows.length.toLocaleString("pt-BR")} livros
            </Button>
          </div>
        </section>
      )}

      <a
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE_CSV)}`}
        download="trapiche-modelo.csv"
        className="self-start inline-flex items-center gap-2 text-[13px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink)"
      >
        <Download size={14} /> Baixar planilha modelo
      </a>

      {history.length > 0 && (
        <section>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mb-2">
            Importações anteriores
          </div>
          <ul className="m-0 p-0 list-none rounded-[14px] border border-[rgba(67,62,18,0.08)] divide-y divide-(--rule)">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => setState(h)}
                  className="w-full text-left flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-(--yellow-soft)"
                >
                  <span className="text-[13.5px] text-(--ink-2)">
                    <strong>{SOURCE_LABEL[h.source]}</strong>
                    {h.fileName ? ` · ${h.fileName}` : ""}
                  </span>
                  <span className="font-mono text-[10.5px] text-(--ink-4)">
                    {h.imported} importados · {h.when}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
