"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dices } from "lucide-react";
import Modal from "@/components/shared/modal";
import BookCover from "@/components/shared/book-cover";
import { Button } from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { setShelfStatus } from "@/lib/actions/shelf";
import type { Book } from "@/lib/types/book";
import { cn } from "@/lib/utils";

export interface PileItem {
  book: Book;
  tags: string[];
}

type Length = "any" | "short" | "medium" | "long";
const LENGTHS: { id: Length; label: string; test: (p: number) => boolean }[] = [
  { id: "any", label: "Qualquer tamanho", test: () => true },
  { id: "short", label: "Curto (até 200)", test: (p) => p > 0 && p <= 200 },
  { id: "medium", label: "Médio (200–400)", test: (p) => p > 200 && p <= 400 },
  { id: "long", label: "Longo (400+)", test: (p) => p > 400 },
];

const select =
  "h-10 w-full appearance-none rounded-[10px] border-[1.5px] border-[rgba(var(--ink-rgb),0.14)] bg-(--cream-card) px-3 text-[13px] text-(--ink-2) outline-none focus:border-(--ink-3) cursor-pointer";

export default function PilePicker({
  items,
  tags,
  autoOpen = false,
}: {
  items: PileItem[];
  tags: { id: string; name: string }[];
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen && items.length > 0);
  const [length, setLength] = useState<Length>("any");
  const [tag, setTag] = useState("");
  const [author, setAuthor] = useState("");
  const [pick, setPick] = useState<PileItem | null>(null);
  const [spin, setSpin] = useState(0);
  const { pending, run } = useAction();

  const authors = useMemo(
    () =>
      [...new Set(items.map((i) => i.book.author))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [items],
  );
  const usedTags = tags.filter((t) => items.some((i) => i.tags.includes(t.id)));
  const pool = items.filter(
    (i) =>
      LENGTHS.find((l) => l.id === length)!.test(i.book.pages) &&
      (!tag || i.tags.includes(tag)) &&
      (!author || i.book.author === author),
  );

  const draw = () => {
    if (!pool.length) return;
    const options = pool.length > 1 ? pool.filter((p) => p !== pick) : pool;
    setPick(options[Math.floor(Math.random() * options.length)]);
    setSpin((s) => s + 1);
  };

  if (!items.length) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setPick(null);
        }}
        className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[10px] bg-(--ink-2) text-(--yellow) text-[12.5px] font-semibold cursor-pointer hover:bg-(--ink)"
      >
        <Dices size={15} aria-hidden />
        Não sei o que ler
      </button>
      {open && (
        <Modal
          open
          onOpenChange={setOpen}
          eyebrow={`Sua pilha · ${items.length} ${items.length === 1 ? "livro" : "livros"}`}
          title="Sortear o próximo livro"
          width={520}
        >
          <div
            className={cn(
              "grid gap-2.5",
              usedTags.length ? "sm:grid-cols-3" : "sm:grid-cols-2",
            )}
          >
            <label>
              <span className="sr-only">Tamanho</span>
              <select
                className={select}
                value={length}
                onChange={(e) => setLength(e.target.value as Length)}
              >
                {LENGTHS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            {usedTags.length > 0 && (
              <label>
                <span className="sr-only">Tag</span>
                <select
                  className={select}
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                >
                  <option value="">Qualquer tag</option>
                  {usedTags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              <span className="sr-only">Autor</span>
              <select
                className={select}
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              >
                <option value="">Qualquer autor</option>
                {authors.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 min-h-64 rounded-[16px] border border-dashed border-[rgba(var(--ink-rgb),0.2)] flex items-center justify-center p-5">
            {pick ? (
              <div
                key={spin}
                className="flex flex-col items-center text-center animate-[pileIn_0.45s_cubic-bezier(0.2,0.8,0.2,1)]"
              >
                <Link prefetch={false} href={`/book/${pick.book.id}`}>
                  <BookCover
                    book={pick.book}
                    size="md"
                    style={{ width: 120, height: 180 }}
                  />
                </Link>
                <div className="mt-3 text-[16px] font-bold text-(--ink) leading-tight max-w-80">
                  {pick.book.title}
                </div>
                <div className="mt-0.5 text-[12.5px] text-(--ink-4)">
                  {pick.book.author}
                  {pick.book.pages ? ` · ${pick.book.pages} páginas` : ""}
                </div>
              </div>
            ) : (
              <p
                aria-live="polite"
                className="m-0 text-[13.5px] text-(--ink-4) text-center max-w-70"
              >
                {pool.length
                  ? `${pool.length} ${pool.length === 1 ? "livro entra" : "livros entram"} no sorteio.`
                  : "Nenhum livro da pilha com esses filtros."}
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2.5">
            <Button
              type="button"
              variant={pick ? "ghost" : "primary"}
              onClick={draw}
              disabled={!pool.length}
            >
              <Dices size={15} aria-hidden className={cn(pick && "mr-0.5")} />
              {pick ? "Sortear de novo" : "Sortear"}
            </Button>
            {pick && (
              <Button
                type="button"
                variant="yellow"
                loading={pending}
                onClick={() =>
                  run(
                    () =>
                      setShelfStatus(pick.book.id, "READING", {
                        startedAt: new Date().toISOString().slice(0, 10),
                      }),
                    () => {
                      toast(`Boa leitura com ${pick.book.title}!`);
                      router.push(`/book/${pick.book.id}`);
                    },
                    toast,
                  )
                }
              >
                Começar a ler
              </Button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
