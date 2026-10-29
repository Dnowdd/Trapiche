import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthorPage } from "@/lib/queries/people";
import { initialsOf } from "@/lib/queries/book";
import Synopsis from "../../book/[id]/_components/synopsis";
import WorksGrid from "../../_components/works-grid";

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = decodeURIComponent((await params).name);
  return {
    title: name,
    description: `Livros de ${name} no Trapiche.`,
  };
}

export default async function AuthorPage({ params }: Props) {
  const name = decodeURIComponent((await params).name);
  const data = await getAuthorPage(name);
  if (!data) notFound();
  const { profile, works } = data;
  const life =
    profile?.born || profile?.died
      ? [profile.born ?? "?", profile.died].filter(Boolean).join("–")
      : null;

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
          <span>Autores</span>
          <span className="text-(--ink-5)">/</span>
          <span className="text-(--ink-2)">{data.name}</span>
        </nav>

        <section className="flex flex-col sm:flex-row gap-6 sm:gap-8 sm:items-start pb-8 border-b border-(--rule)">
          <div className="w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-full overflow-hidden bg-(--yellow) border-[1.5px] border-(--ink-2) flex items-center justify-center text-[36px] sm:text-[44px] font-extrabold text-(--ink-2) relative">
            {profile?.photoUrl ? (
              <Image
                src={profile.photoUrl}
                alt={`Foto de ${data.name}`}
                fill
                sizes="144px"
                className="object-cover"
              />
            ) : (
              initialsOf(data.name)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase">
              Autor{life ? ` · ${life}` : ""}
            </div>
            <h1 className="m-0 mt-2 text-[34px] md:text-[44px] font-extrabold tracking-[-0.025em] leading-[1.02] text-(--ink)">
              {data.name}
            </h1>
            <div className="mt-2 text-[14px] text-(--ink-3)">
              {works.length} {works.length === 1 ? "obra" : "obras"} no catálogo
            </div>
            {profile?.bio && (
              <div className="mt-5">
                <Synopsis description={profile.bio} />
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <WorksGrid works={works} />
        </section>
      </div>
    </div>
  );
}
