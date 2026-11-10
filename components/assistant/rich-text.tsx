import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import {
  parseMarkdown,
  type Inline,
  type Line,
} from "@/lib/assistant/markdown";
import { cn } from "@/lib/utils";

interface Ctx {
  onNavigate?: () => void;
  bookIds?: Set<string>;
}

function inline(nodes: Inline[], ctx: Ctx): ReactNode {
  return nodes.map((n, i) => {
    switch (n.type) {
      case "text":
        return <Fragment key={i}>{n.text}</Fragment>;
      case "strong":
        return (
          <strong key={i} className="font-semibold text-(--ink)">
            {inline(n.children, ctx)}
          </strong>
        );
      case "em":
        return <em key={i}>{inline(n.children, ctx)}</em>;
      case "code":
        return (
          <code
            key={i}
            className="rounded bg-[rgba(var(--ink-rgb),0.07)] px-1 py-px font-mono text-[0.88em]"
          >
            {n.text}
          </code>
        );
      case "link": {
        const bookId = /^\/book\/([^/?#]+)/.exec(n.href)?.[1];
        if (bookId && ctx.bookIds && !ctx.bookIds.has(bookId))
          return <Fragment key={i}>{inline(n.children, ctx)}</Fragment>;
        return (
          <Link
            prefetch={false}
            key={i}
            href={n.href}
            onClick={ctx.onNavigate}
            className="font-medium text-(--ink) underline decoration-[rgba(var(--ink-rgb),0.35)] underline-offset-[3px] hover:decoration-(--ink-2)"
          >
            {inline(n.children, ctx)}
          </Link>
        );
      }
    }
  });
}

function lines(rows: Line[], ctx: Ctx) {
  return rows.map((row, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {inline(row, ctx)}
    </Fragment>
  ));
}

export default function RichText({
  text,
  className,
  onNavigate,
  bookIds,
}: {
  text: string;
  className?: string;
  onNavigate?: () => void;
  bookIds?: Set<string>;
}) {
  const blocks = parseMarkdown(text);
  const ctx: Ctx = { onNavigate, bookIds };
  return (
    <div
      className={cn(
        "flex flex-col gap-3 text-[14.5px] leading-[1.65] text-(--ink-2) [overflow-wrap:anywhere]",
        className,
      )}
    >
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return (
              <p key={i} className="m-0">
                {lines(b.lines, ctx)}
              </p>
            );
          case "h":
            return (
              <p key={i} className="m-0 font-bold text-(--ink)">
                {inline(b.line, ctx)}
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="m-0 border-l-[3px] border-(--data-mark) pl-3.5 italic text-(--ink-3)"
              >
                {lines(b.lines, ctx)}
              </blockquote>
            );
          case "ul":
            return (
              <ul
                key={i}
                role="list"
                className="m-0 flex flex-col gap-1.5 pl-0 list-none"
              >
                {b.items.map((item, j) => (
                  <li key={j} className="relative pl-4.5">
                    <span
                      aria-hidden
                      className="absolute left-1 top-[0.7em] size-1.5 rounded-full bg-(--data-mark)"
                    />
                    {lines(item, ctx)}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol
                key={i}
                role="list"
                start={b.start}
                className="m-0 flex flex-col gap-1.5 pl-0 list-none"
              >
                {b.items.map((item, j) => (
                  <li key={j} className="relative pl-6.5">
                    <span
                      aria-hidden
                      className="absolute left-0 top-[0.2em] min-w-5 font-mono text-[11.5px] font-semibold text-(--ink-3) tabular-nums"
                    >
                      {b.start + j}.
                    </span>
                    {lines(item, ctx)}
                  </li>
                ))}
              </ol>
            );
        }
      })}
    </div>
  );
}
