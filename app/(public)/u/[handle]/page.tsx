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
  type ProfileData,
  type Tab,
} from "@/lib/queries/profile";
import { profileJsonLd, JsonLd } from "@/lib/seo";
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
import CitacoesTab from "./_components/citacoes-tab";
import { getProfileQuotes } from "@/lib/queries/quotes";
import { getUserTags } from "@/lib/queries/tags";
import { TabSkeleton } from "./_components/skeletons";
import PrivateProfile from "./_components/private-profile";
import VisitorPreviewBar from "./_components/visitor-preview-bar";

interface Props {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{
    tab?: string;
    status?: string;
    historico?: string;
    entradas?: string;
    editar?: string;
    meta?: string;
    visitante?: string;
    tag?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(handle, null);
  if (!profile) return {};
  const title = `${profile.user.name} (@${profile.user.handle})`;
  const description = profileDescription(profile);
  return {
    title,
    description,
    alternates: { canonical: `/u/${profile.user.handle}` },
    robots: profile.access.indexable
      ? undefined
      : { index: false, follow: false },
    openGraph: {
      type: "profile",
      title,
      description,
      url: `/u/${profile.user.handle}`,
      username: profile.user.handle,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function profileDescription(profile: ProfileData) {
  if (!profile.access.canView)
    return `${profile.user.name} está no Trapiche, o diário de leituras.`;
  if (profile.user.bio) return profile.user.bio.slice(0, 200);
  const read = profile.stats.find((s) => s.label === "lidos")?.value;
  return read
    ? `${profile.user.name} já leu ${read} ${read === 1 ? "livro" : "livros"}. Veja a estante, as resenhas e as listas no Trapiche.`
    : `Leituras, resenhas e listas de ${profile.user.name} no Trapiche.`;
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
  profile: ProfileData;
  viewerId: string | null;
}) {
  const uid = profile.user.id;
  const owner = profile.isOwner;
  const sections = profile.access.sections;

  switch (tab) {
    case "inicio": {
      const pages = Math.min(20, Math.max(0, Number(sp.historico) || 0));
      const full = pages > 0;
      const [data, goal] = await Promise.all([
        getInicio(uid, viewerId, full ? pages * 30 : 8, sections),
        full || !sections.goal
          ? Promise.resolve(null)
          : getGoal(uid, today().getUTCFullYear()),
      ]);
      return (
        <InicioTab
          data={data}
          goal={goal}
          sections={sections}
          shelf={profile.shelf!}
          handle={handle}
          isOwner={owner}
          page={pages}
          openGoal={owner && sp.meta === "1"}
        />
      );
    }
    case "estante":
      return (
        <EstanteTab
          items={await getEstante(uid, owner)}
          tags={await getUserTags(uid, owner)}
          initialTag={sp.tag}
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
    case "citacoes":
      return (
        <CitacoesTab
          items={await getProfileQuotes(uid, owner)}
          isOwner={owner}
          loggedIn={viewerId != null}
        />
      );
  }
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { handle } = await params;
  const sp = await searchParams;
  if (sp.tab && LEGACY_TABS[sp.tab])
    redirect(`/u/${handle}?tab=${LEGACY_TABS[sp.tab]}`);
  const realViewerId = await getViewerId();
  const own = await getProfile(handle, realViewerId);
  if (!own) notFound();
  const preview = own.isOwner && sp.visitante === "1";
  const viewerId = preview ? null : realViewerId;
  const profile = preview ? (await getProfile(handle, null))! : own;

  const shell =
    "bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden";

  if (!profile.access.canView || !profile.counts)
    return (
      <div data-responsive className={shell}>
        {preview && <VisitorPreviewBar handle={handle} />}
        <PrivateProfile profile={profile} />
      </div>
    );

  const tab: Tab = profile.tabs.includes(sp.tab as Tab)
    ? (sp.tab as Tab)
    : "inicio";

  return (
    <div data-responsive className={shell}>
      {profile.access.indexable && <JsonLd data={profileJsonLd(profile)} />}
      {preview && <VisitorPreviewBar handle={handle} />}
      <ProfileCard
        profile={profile}
        autoEdit={profile.isOwner ? sp.editar : undefined}
        preview={preview}
      />
      <ProfileTabs
        handle={handle}
        active={tab}
        counts={profile.counts}
        tabs={profile.tabs}
        suffix={preview ? "&visitante=1" : ""}
      />
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
