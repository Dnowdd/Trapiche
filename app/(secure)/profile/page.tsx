"use client";

import { useState } from "react";
import AbandonosTab from "./_components/abandonos-tab";
import AvaliacoesTab from "./_components/avaliacoes-tab";
import CurtidasTab from "./_components/curtidas-tab";
import DiarioTab from "./_components/diario-tab";
import InicioTab from "./_components/inicio-tab";
import ListasTab from "./_components/listas-tab";
import ProfileCard from "./_components/profile-card";
import ReleiturasTab from "./_components/releituras-tab";

const Profile = () => {
  const [tab, setTab] = useState("inicio");

  const TABS = [
    { id: "inicio", label: "Início", count: null },
    { id: "diario", label: "Diário", count: 142 },
    { id: "avaliacoes", label: "Avaliações", count: 12 },
    { id: "listas", label: "Listas", count: 8 },
    { id: "curtidas", label: "Curtidas", count: 34 },
    { id: "abandonos", label: "Abandonos", count: 47 },
    { id: "releituras", label: "Releituras", count: 6 },
  ];

  return (
    <div className="bg-(--cream) rounded-[30px] border-15 border-(--yellow) mx-3.75 overflow-hidden">
      <ProfileCard />

      <div className="px-15 border-b border-[rgba(67,62,18,0.12)]">
        <div className="flex gap-8 overflow-x-auto" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className="group relative bg-transparent border-0 pt-4.5 pb-4 cursor-pointer font-mono text-[11px] uppercase tracking-widest text-(--ink-4) flex items-center gap-1.75 whitespace-nowrap transition-colors duration-150 hover:text-(--ink-2) aria-selected:text-(--ink) aria-selected:after:content-[''] aria-selected:after:absolute aria-selected:after:left-0 aria-selected:after:right-0 aria-selected:after:-bottom-px aria-selected:after:h-0.5 aria-selected:after:bg-(--ink-2) aria-selected:after:rounded-sm"
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.count != null && (
                <span className="font-mono text-[10px] text-(--ink-5) bg-[rgba(67,62,18,0.06)] rounded py-px px-1.5 tracking-normal group-aria-selected:bg-(--ink-2) group-aria-selected:text-(--yellow)">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-9 px-15 pb-15" data-screen-label={`Tab: ${tab}`}>
        {tab === "inicio" && <InicioTab />}
        {tab === "diario" && <DiarioTab />}
        {tab === "avaliacoes" && <AvaliacoesTab />}
        {tab === "listas" && <ListasTab />}
        {tab === "curtidas" && <CurtidasTab />}
        {tab === "abandonos" && <AbandonosTab />}
        {tab === "releituras" && <ReleiturasTab />}
      </div>
    </div>
  );
};

export default Profile;
