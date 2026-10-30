import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getViewerId } from "@/lib/session";
import {
  getAvaliacoes,
  getCurtidas,
  getDiario,
  getEstante,
  getInicio,
  getListas,
  getProfile,
  getReadingNow,
  TABS,
  type Tab,
} from "@/lib/queries/profile";
import { getGoal } from "@/lib/queries/stats";
import { today } from "@/lib/dates";
import ProfileCard from "./_components/profile-card";
import ProfileTabs from "./_components/profile-tabs";
import InicioTab from "./_components/inicio-tab";
import EstanteTab from "./_components/estante-tab";
import DiarioTab from "./_components/diario-tab";
import AvaliacoesTab from "./_components/avaliacoes-tab";
import ListasTab from "./_components/listas-tab";
import CurtidasTab from "./_components/curtidas-tab";
import { TabSkeleton } from "./_components/skeletons";

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

const LEGACY_TABS: Record<string, string> = {
  abandonos: "estante&status=ABANDONED",
  releituras: "estante&status=REREADING",
};

type SearchParams = Awaited<Props["searchParams"]>;

async function TabContent({
  tab,
  sp,
  handle,
  profile,
  viewerId,
}: {
  tab: Tab;
  sp: SearchParams;
  handle: string;
  profile: NonNullable<Awaited<ReturnType<typeof getProfile>>>;
  viewerId: string | null;
}) {
  const uid = profile.user.id;
  const owner = profile.isOwner;

  switch (tab) {
    case "inicio": {
      const pages = Math.min(20, Math.max(0, Number(sp.historico) || 0));
      const full = pages > 0;
      const [data, goal] = await Promise.all([
        getInicio(uid, viewerId, full ? pages * 30 : 8),
        full ? Promise.resolve(null) : getGoal(uid, today().getUTCFullYear()),
      ]);
      return (
        <InicioTab
          data={data}
          goal={goal}
          shelf={profile.shelf}
          handle={handle}
          isOwner={owner}
          page={pages}
        />
      );
    }
    case "estante":
      return (
        <EstanteTab
          items={await getEstante(uid)}
          initial={sp.status}
          handle={handle}
          isOwner={owner}
        />
      );
    case "diario": {
      const limit = Math.min(500, Math.max(20, Number(sp.entradas) || 20));
      const [data, reading] = await Promise.all([
        getDiario(uid, limit),
        owner ? getReadingNow(uid) : Promise.resolve([]),
      ]);
      return (
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
    }
    case "avaliacoes":
      return (
        <AvaliacoesTab
          items={await getAvaliacoes(uid, owner)}
          isOwner={owner}
        />
      );
    case "listas":
      return (
        <ListasTab items={await getListas(uid, viewerId)} isOwner={owner} />
      );
    case "curtidas":
      return <CurtidasTab items={await getCurtidas(uid)} />;
  }
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { handle } = await params;
  const sp = await searchParams;
  if (sp.tab && LEGACY_TABS[sp.tab])
    redirect(`/u/${handle}?tab=${LEGACY_TABS[sp.tab]}`);
  const viewerId = await getViewerId();
  const profile = await getProfile(handle, viewerId);
  if (!profile) notFound();

  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "inicio";

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <ProfileCard profile={profile} />
      <ProfileTabs handle={handle} active={tab} counts={profile.counts} />
      <div
        className="pt-7 md:pt-9 px-4 sm:px-8 lg:px-15 pb-12 md:pb-15"
        data-screen-label={`Tab: ${tab}`}
      >
        <Suspense
          key={JSON.stringify({ tab, ...sp })}
          fallback={<TabSkeleton tab={tab} />}
        >
          <TabContent
            tab={tab}
            sp={sp}
            handle={handle}
            profile={profile}
            viewerId={viewerId}
          />
        </Suspense>
      </div>
    </div>
  );
}
