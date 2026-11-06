import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import {
  parseMarkdown,
  type Inline,
  type Line,
} from "@/lib/assistant/markdown";
import { cn } from "@/lib/utils";

function inline(nodes: Inline[], onNavigate?: () => void): ReactNode {
  return nodes.map((n, i) => {
    switch (n.type) {
      case "text":
        return <Fragment key={i}>{n.text}</Fragment>;
      case "strong":
        return (
          <strong key={i} className="font-semibold text-(--ink)">
            {inline(n.children, onNavigate)}
          </strong>
        );
      case "em":
        return <em key={i}>{inline(n.children, onNavigate)}</em>;
      case "code":
        return (
          <code
            key={i}
            className="rounded bg-[rgba(var(--ink-rgb),0.07)] px-1 py-px font-mono text-[0.88em]"
          >
            {n.text}
          </code>
        );
      case "link":
        return (
          <Link
            key={i}
            href={n.href}
            onClick={onNavigate}
            className="font-medium text-(--ink) underline decoration-[rgba(var(--ink-rgb),0.35)] underline-offset-[3px] hover:decoration-(--ink-2)"
          >
            {inline(n.children, onNavigate)}
          </Link>
        );
    }
  });
}

function lines(rows: Line[], onNavigate?: () => void) {
  return rows.map((row, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {inline(row, onNavigate)}
    </Fragment>
  ));
}

export default function RichText({
  text,
  className,
  onNavigate,
}: {
  text: string;
  className?: string;
  onNavigate?: () => void;
}) {
  const blocks = parseMarkdown(text);
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
                {lines(b.lines, onNavigate)}
              </p>
            );
          case "h":
            return (
              <p key={i} className="m-0 font-bold text-(--ink)">
                {inline(b.line, onNavigate)}
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="m-0 border-l-[3px] border-(--data-mark) pl-3.5 italic text-(--ink-3)"
              >
                {lines(b.lines, onNavigate)}
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
                    {lines(item, onNavigate)}
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
                    {lines(item, onNavigate)}
                  </li>
                ))}
              </ol>
            );
        }
      })}
    </div>
  );
}
