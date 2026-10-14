import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getViewerId } from "@/lib/session";
import {
  getAbandonos,
  getAvaliacoes,
  getCurtidas,
  getDiario,
  getEstante,
  getInicio,
  getListas,
  getProfile,
  getReadingNow,
  getReleituras,
  TABS,
  type Tab,
} from "@/lib/queries/profile";
import ProfileCard from "./_components/profile-card";
import ProfileTabs from "./_components/profile-tabs";
import InicioTab from "./_components/inicio-tab";
import EstanteTab from "./_components/estante-tab";
import DiarioTab from "./_components/diario-tab";
import AvaliacoesTab from "./_components/avaliacoes-tab";
import ListasTab from "./_components/listas-tab";
import CurtidasTab from "./_components/curtidas-tab";
import AbandonosTab from "./_components/abandonos-tab";
import ReleiturasTab from "./_components/releituras-tab";

interface Props {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{
    tab?: string;
    status?: string;
    historico?: string;
    entradas?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(handle, await getViewerId());
  if (!profile) return {};
  return {
    title: `${profile.user.name} (@${profile.user.handle})`,
    description:
      profile.user.bio ?? `Leituras de ${profile.user.name} no Trapiche.`,
  };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { handle } = await params;
  const sp = await searchParams;
  const viewerId = await getViewerId();
  const profile = await getProfile(handle, viewerId);
  if (!profile) notFound();

  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "inicio";
  const uid = profile.user.id;
  const owner = profile.isOwner;

  let content: React.ReactNode;
  switch (tab) {
    case "inicio": {
      const full = sp.historico === "1";
      content = (
        <InicioTab
          data={await getInicio(uid, viewerId, full)}
          handle={handle}
          isOwner={owner}
          full={full}
        />
      );
      break;
    }
    case "estante":
      content = (
        <EstanteTab items={await getEstante(uid)} initial={sp.status} />
      );
      break;
    case "diario": {
      const limit = Math.min(500, Math.max(20, Number(sp.entradas) || 20));
      const [data, reading] = await Promise.all([
        getDiario(uid, limit),
        owner ? getReadingNow(uid) : Promise.resolve([]),
      ]);
      content = (
        <DiarioTab
          data={data}
          isOwner={owner}
          handle={handle}
          limit={limit}
          readingBooks={reading.map((r) => ({
            id: r.book.id,
            title: r.book.title,
            currentPage: r.currentPage,
            pageCount: r.pageCount,
          }))}
        />
      );
      break;
    }
    case "avaliacoes":
      content = (
        <AvaliacoesTab items={await getAvaliacoes(uid)} isOwner={owner} />
      );
      break;
    case "listas":
      content = (
        <ListasTab items={await getListas(uid, viewerId)} isOwner={owner} />
      );
      break;
    case "curtidas":
      content = <CurtidasTab items={await getCurtidas(uid)} />;
      break;
    case "abandonos":
      content = (
        <AbandonosTab items={await getAbandonos(uid)} isOwner={owner} />
      );
      break;
    case "releituras":
      content = <ReleiturasTab items={await getReleituras(uid)} />;
      break;
  }

  return (
    <div className="bg-(--cream) rounded-[30px] border-15 border-(--yellow) mx-3.75 overflow-hidden">
      <ProfileCard profile={profile} />
      <ProfileTabs handle={handle} active={tab} counts={profile.counts} />
      <div className="pt-9 px-15 pb-15" data-screen-label={`Tab: ${tab}`}>
        {content}
      </div>
    </div>
  );
}
