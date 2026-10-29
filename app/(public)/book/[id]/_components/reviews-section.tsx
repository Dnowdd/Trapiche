"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import ReviewModal from "@/components/reading/review-modal";
import { Button } from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { deleteReview } from "@/lib/actions/reviews";
import type { BookPageData } from "@/lib/queries/book";
import ReviewCard from "./review-card";
import Stars from "@/components/shared/stars";
import { SectionHeader } from "./section-header";

function promptFor(v: BookPageData["viewer"]) {
  if (!v) return "Entre na sua conta para dar sua nota e escrever o que achou.";
  if (v.status === "READING" || v.status === "REREADING")
    return v.reading
      ? `Você está em ${v.reading.progress}% da leitura. Já tem algo a dizer?`
      : "Já tem algo a dizer sobre a leitura?";
  if (v.status === "READ")
    return "Você terminou. Dê sua nota e conte o que ficou com você.";
  if (v.status === "ABANDONED")
    return "Resenha de livro abandonado também vale. Conte por que não engatou.";
  return "Já leu? Dê sua nota e conte o que achou.";
}

function Distribution({ rating }: { rating: BookPageData["rating"] }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {[5, 4, 3, 2, 1].map((n) => {
        const v = rating.distribution[n as 1 | 2 | 3 | 4 | 5];
        const pct = rating.count ? (v / rating.count) * 100 : 0;
        return (
          <div
            className="grid grid-cols-[24px_1fr_32px] gap-2.5 items-center"
            key={n}
          >
            <span className="font-mono text-[11px] text-(--ink-3)">{n}★</span>
            <div className="h-1.5 bg-[rgba(67,62,18,0.07)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-(--ink-2)"
                style={{ width: pct + "%" }}
              />
            </div>
            <span className="font-mono text-[11px] text-(--ink-4) text-right">
              {v.toLocaleString("pt-BR")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ReviewsSection({ data }: { data: BookPageData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending, run } = useAction();
  const { rating, reviews, viewer: v } = data;
  const review = v?.review;
  const loggedIn = v != null;
  const write = () => (v ? setOpen(true) : router.push("/auth"));
  const empty = rating.count === 0 && reviews.items.length === 0 && !review;

  const stats = [
    rating.avgDaysToRead != null && {
      label: "Leitura média",
      value: `${rating.avgDaysToRead} ${rating.avgDaysToRead === 1 ? "dia" : "dias"}`,
    },
    rating.publicListsCount > 0 && {
      label: "Em listas públicas",
      value: rating.publicListsCount.toLocaleString("pt-BR"),
    },
  ].filter((s): s is { label: string; value: string } => Boolean(s));

  return (
    <section
      id="avaliacoes"
      className="scroll-mt-6"
      data-screen-label="04 Avaliações"
    >
      <SectionHeader
        eyebrow="Avaliações"
        title="O que os leitores acham"
        action={
          reviews.total > reviews.items.length ? (
            <Link
              className="text-[12px] text-(--ink-3) border-b border-(--ink-4) hover:text-(--ink)"
              href={`/book/${data.book.id}/resenhas`}
            >
              Ver todas as {reviews.total.toLocaleString("pt-BR")}
            </Link>
          ) : null
        }
      />

      {empty ? (
        <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[16px] p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <div className="text-[16px] font-bold text-(--ink)">
              Ninguém avaliou esse livro ainda
            </div>
            <p className="m-0 mt-1 text-[13px] text-(--ink-3) leading-normal">
              {loggedIn
                ? "Sua nota e sua resenha podem ser as primeiras."
                : "Entre na sua conta e seja a primeira pessoa a avaliar."}
            </p>
          </div>
          <WriteButton loggedIn={loggedIn} onClick={write} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rating.count > 0 && (
            <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[16px] p-6 grid gap-6 sm:grid-cols-[auto_1fr] items-center">
              <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 sm:pr-6 sm:border-r border-(--rule)">
                <div className="text-[48px] font-extrabold tracking-[-0.03em] leading-none text-(--ink)">
                  {rating.average.toFixed(1).replace(".", ",")}
                </div>
                <div>
                  <Stars value={rating.average} className="text-[18px]" />
                  <div className="text-[12px] text-(--ink-4) mt-0.5">
                    {rating.count.toLocaleString("pt-BR")}{" "}
                    {rating.count === 1 ? "avaliação" : "avaliações"}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <Distribution rating={rating} />
                {stats.length > 0 && (
                  <div className="flex gap-6 text-[12px] text-(--ink-4)">
                    {stats.map((s) => (
                      <span key={s.label}>
                        {s.label}{" "}
                        <strong className="text-(--ink-2) font-semibold">
                          {s.value}
                        </strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {review ? (
            <div className="bg-(--yellow-soft) border border-(--yellow-deep) rounded-[16px] py-5 px-6">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase">
                  Sua resenha
                </span>
                <Stars value={review.rating} className="text-[16px]" />
                <span className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase">
                  {review.date}
                </span>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="ghost"
                    className="h-8 px-3 text-[12px]"
                    onClick={() => setOpen(true)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    className="h-8 px-3 text-[12px]"
                    loading={pending}
                    onClick={() => {
                      if (!window.confirm("Apagar sua resenha e a nota?"))
                        return;
                      run(
                        () => deleteReview(data.book.id),
                        () => toast("Resenha apagada."),
                        toast,
                      );
                    }}
                  >
                    Apagar
                  </Button>
                </div>
              </div>
              {review.text ? (
                <p className="m-0 text-[14px] leading-[1.6] text-(--ink-2) whitespace-pre-line">
                  {review.text}
                </p>
              ) : (
                <p className="m-0 text-[13px] text-(--ink-3)">
                  Só a nota, sem texto.{" "}
                  <button
                    type="button"
                    className="font-semibold text-(--ink-2) border-b border-(--ink-4) cursor-pointer"
                    onClick={() => setOpen(true)}
                  >
                    Escrever algo
                  </button>
                </p>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-[rgba(67,62,18,0.2)] rounded-[16px] py-4 px-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <p className="m-0 text-[13px] text-(--ink-3)">{promptFor(v)}</p>
              <WriteButton loggedIn={loggedIn} onClick={write} />
            </div>
          )}

          {reviews.items.map((r) => (
            <ReviewCard key={r.id} review={r} loggedIn={loggedIn} />
          ))}
        </div>
      )}

      {v && open && (
        <ReviewModal
          open
          onOpenChange={setOpen}
          bookId={data.book.id}
          title={data.book.title}
          initial={review}
        />
      )}
    </section>
  );
}

function WriteButton({
  loggedIn,
  onClick,
}: {
  loggedIn: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="shrink-0 self-start sm:self-auto h-10 px-4 rounded-[10px] bg-(--yellow) border border-(--yellow-deep) text-(--ink) text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer hover:bg-(--yellow-deep)"
      onClick={onClick}
    >
      <PenLine className="w-3.5 h-3.5" />
      {loggedIn ? "Avaliar" : "Entrar para avaliar"}
    </button>
  );
}
