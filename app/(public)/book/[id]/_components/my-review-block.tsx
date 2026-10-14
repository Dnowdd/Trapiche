"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReviewModal from "@/components/reading/review-modal";
import { Button } from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { deleteReview } from "@/lib/actions/reviews";
import type { BookPageData } from "@/lib/queries/book";

function copyFor(v: BookPageData["viewer"]) {
  if (!v) {
    return {
      title: "Já leu esse livro?",
      text: "Entre na sua conta para dar sua nota e escrever o que achou.",
    };
  }
  if (v.reading && (v.status === "READING" || v.status === "REREADING")) {
    return {
      title: "Escreva quando terminar — sem pressa.",
      text: `Você está no meio da leitura (${v.reading.progress}% concluído). A gente vai te lembrar quando você marcar como lido. Ou, se já tem o que dizer, vai fundo agora.`,
    };
  }
  if (v.status === "READ") {
    return {
      title: "Você terminou. E aí?",
      text: "Dê sua nota e conte o que ficou com você. Pode ser curto.",
    };
  }
  if (v.status === "ABANDONED") {
    return {
      title: "Abandonou, mas tem opinião?",
      text: "Resenha de livro abandonado também vale. Conte por que não engatou.",
    };
  }
  return {
    title: "Já leu esse livro?",
    text: "Dê sua nota e escreva o que achou. Se ainda não leu, marque “Quero ler”.",
  };
}

export default function MyReviewBlock({ data }: { data: BookPageData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending, run } = useAction();
  const v = data.viewer;
  const review = v?.review;
  const copy = copyFor(v);

  return (
    <section className="mt-14" data-screen-label="05 Sua resenha">
      <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
        Sua resenha
      </div>
      <h2 className="m-0 mb-1.5 text-[24px] font-bold tracking-[-0.015em] text-(--ink)">
        O que você acha desse livro?
      </h2>
      <div className="h-4.5" />
      {review ? (
        <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-6 px-7">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="text-[20px] text-(--ink-2) tracking-[-1px]">
              {[0, 1, 2, 3, 4].map((s) => (
                <span
                  key={s}
                  className={
                    s < review.rating ? "" : "text-[rgba(67,62,18,0.18)]"
                  }
                >
                  ★
                </span>
              ))}
            </div>
            <span className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase">
              {review.date}
            </span>
            <div className="ml-auto flex gap-2">
              <Button
                variant="ghost"
                className="h-8.5 px-3.5 text-[12px]"
                onClick={() => setOpen(true)}
              >
                Editar
              </Button>
              <Button
                variant="danger"
                className="h-8.5 px-3.5 text-[12px]"
                loading={pending}
                onClick={() => {
                  if (!window.confirm("Apagar sua resenha e a nota?")) return;
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
            <p className="m-0 text-[14px] leading-[1.6] text-(--ink-3) whitespace-pre-line">
              {review.text}
            </p>
          ) : (
            <p className="m-0 text-[13px] text-(--ink-4)">
              Só a nota, sem texto. Quer escrever algo?
            </p>
          )}
        </div>
      ) : (
        <div className="bg-(--cream-card) border-[1.5px] border-dashed border-[rgba(67,62,18,0.2)] rounded-[18px] py-8 px-9 flex items-center justify-between gap-7.5">
          <div className="max-w-135">
            <h3 className="m-0 mb-1.5 text-[18px] font-bold text-(--ink)">
              {copy.title}
            </h3>
            <p className="m-0 text-[13px] text-(--ink-3) leading-[1.55]">
              {copy.text}
            </p>
          </div>
          <button
            className="shrink-0 text-[13px] font-semibold py-3 px-5.5 rounded-lg bg-(--yellow) text-(--ink) border border-(--yellow-deep) cursor-pointer inline-flex gap-2 items-center transition-transform duration-100 hover:-translate-y-px"
            onClick={() => (v ? setOpen(true) : router.push("/auth"))}
          >
            {v ? "Escrever resenha" : "Entrar"}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
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
