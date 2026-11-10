import Link from "next/link";

export default function VisitorPreviewBar({ handle }: { handle: string }) {
  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-(--ink-2) text-(--cream) px-4 sm:px-8 lg:px-15 py-3">
      <div className="flex items-center gap-2.5 text-[13px]">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-(--yellow)"
          aria-hidden
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>
          Você está vendo seu perfil <strong>como um visitante</strong>{" "}
          <span className="opacity-70">sem conta no Trapiche.</span>
        </span>
      </div>
      <Link
        prefetch={false}
        href={`/u/${handle}`}
        className="h-8 px-3 rounded-lg bg-(--yellow) text-(--ink) text-[12px] font-semibold inline-flex items-center hover:brightness-95"
      >
        Sair da prévia
      </Link>
    </div>
  );
}
