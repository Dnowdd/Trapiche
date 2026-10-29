"use client";

import Stars from "@/components/shared/stars";
import { Flag, Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, TextArea } from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import {
  addReviewComment,
  deleteReviewComment,
  getReviewComments,
  toggleReviewLike,
} from "@/lib/actions/reviews";
import type { ReviewItem } from "@/lib/queries/book";
import SpoilerText from "@/components/shared/spoiler-text";
import ReportModal from "@/components/moderation/report-modal";

type Comment = Awaited<ReturnType<typeof getReviewComments>>[number];

export default function ReviewCard({
  review: r,
  loggedIn,
}: {
  review: ReviewItem;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [reporting, setReporting] = useState<
    { reviewId: string } | { commentId: string } | null
  >(null);
  const like = useAction();
  const comment = useAction();

  const load = async () => setComments(await getReviewComments(r.id));

  const toggleComments = () => {
    setOpen(!open);
    if (!open && comments === null) load();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    comment.run(
      () => addReviewComment(r.id, text),
      async () => {
        setText("");
        await load();
      },
    );
  };

  const report = (target: { reviewId: string } | { commentId: string }) =>
    loggedIn ? setReporting(target) : router.push("/auth");

  const remove = (id: string) =>
    comment.run(() => deleteReviewComment(id), load, toast);

  return (
    <article className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-5.5 px-6.5">
      <div className="flex items-center gap-3.5 mb-3">
        <Link
          href={`/u/${r.handle}`}
          className="w-9 h-9 rounded-full bg-(--cream-deep) border-[1.5px] border-(--ink-3) flex items-center justify-center text-[12px] font-bold text-(--ink-2)"
        >
          {r.initials}
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/u/${r.handle}`}
            className="text-[14px] font-semibold text-(--ink-2) hover:underline"
          >
            {r.user}
          </Link>
          <div className="text-[11px] text-(--ink-4) font-mono tracking-[0.04em]">
            @{r.handle}
          </div>
        </div>
        <div className="text-[16px] text-(--ink-2) tracking-[-1px]">
          <Stars value={r.stars} />
        </div>
        <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase">
          {r.date}
          {r.edition && ` · sobre a edição ${r.edition}`}
        </div>
      </div>
      <SpoilerText
        spoiler={r.spoiler}
        className="text-[14px] leading-[1.6] text-(--ink-3) text-pretty m-0 mb-3.5 whitespace-pre-line"
      >
        {r.text}
      </SpoilerText>
      <div className="pt-3 border-t border-(--rule) flex items-center gap-4.5 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] [&_strong]:text-(--ink-2) [&_strong]:font-['Inter',sans-serif]">
        <button
          type="button"
          aria-pressed={r.liked}
          disabled={like.pending || r.mine}
          title={r.mine ? "Sua resenha" : r.liked ? "Descurtir" : "Curtir"}
          onClick={() =>
            loggedIn
              ? like.run(() => toggleReviewLike(r.id), undefined, toast)
              : router.push("/auth")
          }
          className="inline-flex items-center gap-1 cursor-pointer hover:text-(--ink-2) aria-pressed:text-(--ink) disabled:cursor-default"
        >
          <Heart
            className="w-3.5 h-3.5"
            fill={r.liked ? "currentColor" : "none"}
          />{" "}
          <strong>{r.likes}</strong>
        </button>
        <button
          type="button"
          aria-expanded={open}
          onClick={toggleComments}
          className="inline-flex items-center gap-1 cursor-pointer hover:text-(--ink-2)"
        >
          <MessageCircle className="w-3.5 h-3.5" />{" "}
          <strong>{r.comments}</strong>
        </button>
        {r.days != null && (
          <span className="ml-auto">
            lido em {r.days} {r.days === 1 ? "dia" : "dias"}
          </span>
        )}
        {!r.mine && (
          <button
            type="button"
            title="Denunciar resenha"
            aria-label="Denunciar resenha"
            onClick={() => report({ reviewId: r.id })}
            className={`${r.days != null ? "" : "ml-auto "}inline-flex items-center cursor-pointer hover:text-(--ink-2)`}
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-(--rule)">
          {comments === null ? (
            <div className="text-[12px] text-(--ink-4)">Carregando…</div>
          ) : comments.length === 0 ? (
            <div className="text-[12px] text-(--ink-4) mb-3">
              Nenhum comentário ainda.
            </div>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-3 mb-4">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <Link
                    href={`/u/${c.handle}`}
                    className="w-7 h-7 shrink-0 rounded-full bg-(--cream-deep) border border-(--ink-3) flex items-center justify-center text-[10px] font-bold text-(--ink-2)"
                  >
                    {c.initials}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-(--ink-4)">
                      <Link
                        href={`/u/${c.handle}`}
                        className="font-semibold text-(--ink-2) hover:underline"
                      >
                        {c.user}
                      </Link>{" "}
                      · {c.date}
                      {c.canDelete && (
                        <button
                          type="button"
                          onClick={() => remove(c.id)}
                          disabled={comment.pending}
                          className="ml-2 text-(--ink-4) underline underline-offset-2 cursor-pointer hover:text-(--ink-2)"
                        >
                          apagar
                        </button>
                      )}
                      {!c.mine && loggedIn && (
                        <button
                          type="button"
                          onClick={() => report({ commentId: c.id })}
                          className="ml-2 text-(--ink-4) underline underline-offset-2 cursor-pointer hover:text-(--ink-2)"
                        >
                          denunciar
                        </button>
                      )}
                    </div>
                    <p className="m-0 mt-0.5 text-[13px] text-(--ink-3) leading-normal whitespace-pre-line">
                      {c.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {loggedIn ? (
            <form onSubmit={submit} className="flex flex-col gap-2">
              {comment.error && (
                <div className="text-[12px] text-red-700">{comment.error}</div>
              )}
              <TextArea
                value={text}
                maxLength={1000}
                placeholder="Escreva um comentário…"
                className="min-h-16 text-[13px]"
                onChange={(e) => setText(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="h-9"
                  loading={comment.pending}
                  disabled={!text.trim()}
                >
                  Comentar
                </Button>
              </div>
            </form>
          ) : (
            <Link
              href="/auth"
              className="text-[12px] text-(--ink-3) border-b border-(--ink-4)"
            >
              Entre para comentar
            </Link>
          )}
        </div>
      )}
      {reporting && (
        <ReportModal
          open
          onOpenChange={(o) => !o && setReporting(null)}
          target={reporting}
        />
      )}
    </article>
  );
}
