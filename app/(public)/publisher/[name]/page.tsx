import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublisherPage } from "@/lib/queries/people";
import WorksGrid, { GoogleWorks } from "../../_components/works-grid";

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = decodeURIComponent((await params).name);
  return {
    title: name,
    description: `Livros publicados por ${name} no Trapiche.`,
  };
}

export default async function PublisherPage({ params }: Props) {
  const name = decodeURIComponent((await params).name);
  const data = await getPublisherPage(name);
  if (!data) notFound();

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="pt-7 md:pt-10 px-4 sm:px-8 lg:px-18.75 pb-12 md:pb-15">
        <nav className="hidden md:flex items-center gap-2 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] mb-7 uppercase">
          <Link href="/" className="hover:text-(--ink-2)">
            Trapiche
          </Link>
          <span className="text-(--ink-5)">/</span>
          <span>Editoras</span>
          <span className="text-(--ink-5)">/</span>
          <span className="text-(--ink-2)">{data.name}</span>
        </nav>

        <section className="pb-8 border-b border-(--rule)">
          <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase">
            Editora
          </div>
          <h1 className="m-0 mt-2 text-[34px] md:text-[44px] font-extrabold tracking-[-0.025em] leading-[1.02] text-(--ink)">
            {data.name}
          </h1>
          <div className="mt-2 text-[14px] text-(--ink-3)">
            {data.works.length + data.googleWorks.length}{" "}
            {data.works.length + data.googleWorks.length === 1
              ? "obra"
              : "obras"}{" "}
            no catálogo
          </div>
        </section>

        {data.works.length > 0 && (
          <section className="mt-10">
            <WorksGrid works={data.works} showAuthor />
          </section>
        )}
        <GoogleWorks works={data.googleWorks} showAuthor />
      </div>
    </div>
  );
}
