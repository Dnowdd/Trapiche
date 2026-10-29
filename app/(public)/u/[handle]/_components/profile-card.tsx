"use client";

import { useState } from "react";
import Link from "next/link";
import { shareLink } from "@/components/reading/share";
import type { ProfileData } from "@/lib/queries/profile";
import EditProfileModal from "./edit-profile-modal";

export default function ProfileCard({ profile }: { profile: ProfileData }) {
  const [editing, setEditing] = useState(false);
  const u = profile.user;

  return (
    <section
      className="pt-8 md:pt-10 px-4 sm:px-8 lg:px-15 pb-8 md:pb-9 grid gap-8 lg:grid-cols-2 lg:gap-10 items-center"
      data-screen-label="01 Perfil"
    >
      <div>
        <div className="flex gap-4 sm:gap-6 items-center">
          <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-(--yellow) border-[1.5px] border-(--ink-2) flex items-center justify-center text-[28px] sm:text-[42px] font-extrabold text-(--ink-2) tracking-[-0.02em] shrink-0">
            {u.initials}
          </div>
          <div className="min-w-0">
            <h1 className="m-0 text-[26px] sm:text-[36px] font-extrabold tracking-[-0.025em] text-(--ink) leading-none">
              {u.name}
            </h1>
            <div className="mt-1.5 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] flex gap-3.5 items-center flex-wrap">
              <span>@{u.handle}</span>
              {u.city && (
                <>
                  <span className="text-(--ink-5)">·</span>
                  <span>{u.city}</span>
                </>
              )}
              <span className="text-(--ink-5)">·</span>
              <span>desde {u.joined}</span>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              {profile.isOwner && (
                <button
                  className="text-[12px] font-medium border border-(--yellow-deep) text-(--ink-2) py-1.75 px-3.5 rounded-md bg-(--yellow) cursor-pointer transition-colors duration-150 hover:bg-(--yellow-soft)"
                  onClick={() => setEditing(true)}
                >
                  Editar perfil
                </button>
              )}
              <button
                className="text-[12px] font-medium border border-(--ink-3) text-(--ink-2) py-1.75 px-3.5 rounded-md bg-transparent cursor-pointer transition-colors duration-150 hover:bg-(--yellow-soft)"
                onClick={() =>
                  shareLink(`/u/${u.handle}`, `${u.name} no Trapiche`)
                }
              >
                Compartilhar
              </button>
            </div>
          </div>
        </div>
        {u.bio ? (
          <p className="mt-2.5 text-[13px] text-(--ink-3) leading-[1.55] max-w-115 whitespace-pre-line">
            {u.bio}
          </p>
        ) : (
          profile.isOwner && (
            <p className="mt-2.5 text-[13px] text-(--ink-4) leading-[1.55] max-w-115">
              Conte um pouco sobre você e o que você gosta de ler em “Editar
              perfil”.
            </p>
          )
        )}
      </div>
      <div className="grid grid-cols-3 border-t lg:border-t-0 lg:border-l border-[rgba(67,62,18,0.1)] pt-2 lg:pt-0 lg:pl-10">
        {profile.stats.map((s) => (
          <Link
            href={`/u/${u.handle}?tab=${s.href}`}
            scroll={false}
            className="py-3 px-2.5 sm:py-3.5 sm:px-4 border-r border-b border-[rgba(67,62,18,0.08)] nth-[3n]:border-r-0 nth-last-[-n+3]:border-b-0 transition-colors duration-150 hover:bg-(--yellow-soft)"
            key={s.label}
          >
            <div className="text-[22px] sm:text-[28px] font-bold tracking-[-0.02em] text-(--ink) leading-none">
              {s.value}
            </div>
            <div className="mt-1 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.06em] text-(--ink-4) leading-tight">
              {s.label}
            </div>
          </Link>
        ))}
      </div>
      {editing && (
        <EditProfileModal
          open
          onOpenChange={setEditing}
          user={{ name: u.name, handle: u.handle, bio: u.bio, city: u.city }}
        />
      )}
    </section>
  );
}
