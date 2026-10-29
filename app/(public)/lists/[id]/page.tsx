import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookCover from "@/components/shared/book-cover";
import { VISIBILITY_LABEL } from "@/components/lists/visibility";
import { getListPage } from "@/lib/queries/lists";
import { getViewerId } from "@/lib/session";
import ListActions from "./_components/list-actions";
import RemoveItem from "./_components/remove-item";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const list = await getListPage(id, await getViewerId());
  return list ? { title: list.title } : {};
}

export default async function ListPage({ params }: Props) {
  const { id } = await params;
  const list = await getListPage(id, await getViewerId());
  if (!list) notFound();

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="pt-7 md:pt-12.5 px-4 sm:px-8 lg:px-18.75 pb-12 md:pb-15">
        <div className="flex items-center gap-2 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] mb-7 uppercase">
          <Link href="/" className="hover:text-(--ink-2)">
            Trapiche
          </Link>
          <span className="text-(--ink-5)">/</span>
          <Link
            href={`/u/${list.owner.handle}?tab=listas`}
            className="hover:text-(--ink-2)"
          >
            @{list.owner.handle}
          </Link>
          <span className="text-(--ink-5)">/</span>
          <span>Listas</span>
          <span className="text-(--ink-5)">/</span>
          <span className="text-(--ink-2) truncate max-w-80">{list.title}</span>
        </div>

        <section className="grid gap-6 md:grid-cols-[1fr_auto] md:gap-10 items-end pb-8 border-b border-(--rule)">
          <div className="min-w-0">
            <div className="font-mono text-[11px] text-(--ink-4) uppercase tracking-[0.06em] flex gap-2 items-center">
              {list.viewer.pinned && (
                <>
                  <span className="text-(--ink-2)">◉ Fixada</span>
                  <span className="text-(--ink-5)">·</span>
                </>
              )}
              <span>{VISIBILITY_LABEL[list.visibility]}</span>
              <span className="text-(--ink-5)">·</span>
              <span>Atualizada {list.updated}</span>
            </div>
            <h1 className="mt-3 mb-2 text-[32px] sm:text-[44px] font-extrabold tracking-[-0.025em] leading-[1.02] text-(--ink) text-balance max-w-200">
              {list.title}
            </h1>
            {list.note && (
              <p className="m-0 text-[15px] text-(--ink-3) leading-[1.55] max-w-170">
                {list.note}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-(--ink-3)">
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-(--cream-deep) border border-(--ink-3) text-[10px] font-bold flex items-center justify-center text-(--ink-2)">
                  {list.owner.initials}
                </span>
                Por{" "}
                <Link
                  href={`/u/${list.owner.handle}`}
                  className="text-(--ink-2) font-semibold hover:underline"
                >
                  {list.by}
                </Link>
              </span>
              <span className="font-mono text-[11px] tracking-[0.04em] text-(--ink-4)">
                <strong className="text-(--ink-2) font-['Inter',sans-serif] text-[13px]">
                  {list.items.length}
                </strong>{" "}
                {list.items.length === 1 ? "livro" : "livros"}
              </span>
              {list.visibility === "PUBLIC" && (
                <span className="font-mono text-[11px] tracking-[0.04em] text-(--ink-4)">
                  <strong className="text-(--ink-2) font-['Inter',sans-serif] text-[13px]">
                    {list.followers.toLocaleString("pt-BR")}
                  </strong>{" "}
                  {list.followers === 1 ? "seguidor" : "seguidores"}
                </span>
              )}
            </div>
          </div>
          <ListActions list={list} />
        </section>

        {list.items.length === 0 ? (
          <div className="mt-10 border-[1.5px] border-dashed border-[rgba(67,62,18,0.22)] rounded-[18px] py-12 px-8 text-center">
            <div className="text-[16px] font-semibold text-(--ink-2)">
              Lista vazia por enquanto
            </div>
            <p className="m-0 mt-1.5 text-[13px] text-(--ink-4)">
              {list.viewer.isMember
                ? "Abra um livro (pela busca lá em cima) e use “Adicionar a uma lista”."
                : "Quem cuida dessa lista ainda não adicionou livros."}
            </p>
          </div>
        ) : (
          <div className="mt-8 md:mt-10 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4.5 gap-y-6 sm:gap-y-8">
            {list.items.map((it) => (
              <div key={it.book.id} className="relative group">
                <Link
                  href={`/book/${it.book.id}`}
                  className="flex flex-col gap-2 transition-transform duration-120 hover:-translate-y-0.5"
                >
                  <BookCover
                    book={it.book}
                    size="md"
                    style={{ width: "100%", aspectRatio: "2/3" }}
                  />
                  <div className="text-[13px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight">
                    {it.book.title}
                  </div>
                  <div className="text-[11px] text-(--ink-4)">
                    {it.book.author}
                  </div>
                  {list.visibility === "SHARED" && (
                    <div className="font-mono text-[10px] text-(--ink-5) tracking-[0.04em]">
                      por {it.addedBy} · {it.when}
                    </div>
                  )}
                </Link>
                {list.viewer.isMember && (
                  <RemoveItem listId={list.id} bookId={it.book.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
