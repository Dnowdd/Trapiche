"use client";

import { useState } from "react";
import Link from "next/link";
import { shareLink } from "@/components/reading/share";
import Avatar from "@/components/shared/avatar";
import type { ProfileData } from "@/lib/queries/profile";
import EditProfileModal from "./edit-profile-modal";
import AvatarEditor from "./avatar-editor";
import { VISIBILITY_LABEL } from "@/lib/privacy";

const avatarCls = "max-sm:size-20! max-sm:text-[28px]!";

const btn =
  "h-9 inline-flex items-center gap-2 text-[12.5px] font-medium px-3.5 rounded-[10px] cursor-pointer transition-colors duration-150";

export default function ProfileCard({
  profile,
  autoEdit,
  preview = false,
}: {
  profile: ProfileData;
  autoEdit?: string;
  preview?: boolean;
}) {
  const [editing, setEditing] = useState<
    false | "perfil" | "privacidade" | "emails" | "conta"
  >(
    autoEdit === "privacidade" || autoEdit === "emails" || autoEdit === "conta"
      ? autoEdit
      : autoEdit
        ? "perfil"
        : false,
  );
  const u = profile.user;
  const owner = profile.isOwner && !preview;

  return (
    <section
      className="relative pt-8 md:pt-11 px-4 sm:px-8 lg:px-15 pb-7 md:pb-8"
      data-screen-label="01 Perfil"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-28 md:h-32 bg-linear-to-b from-(--yellow-soft) to-transparent pointer-events-none"
      />
      <div className="relative flex flex-col md:flex-row md:items-end gap-6 md:gap-10 justify-between">
        <div className="flex gap-5 sm:gap-7 items-start sm:items-center min-w-0">
          {owner ? (
            <AvatarEditor
              name={u.name}
              image={u.image}
              size={112}
              className={avatarCls}
            />
          ) : (
            <Avatar
              name={u.name}
              image={u.image}
              size={112}
              className={avatarCls}
            />
          )}
          <div className="min-w-0">
            <h1 className="m-0 text-[28px] sm:text-[38px] font-extrabold tracking-[-0.03em] text-(--ink) leading-[1.02] wrap-break-word">
              {u.name}
            </h1>
            <div className="mt-2 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] flex gap-x-2.5 gap-y-1 items-center flex-wrap">
              <span className="text-(--ink-2) font-semibold">@{u.handle}</span>
              {u.city && (
                <>
                  <span className="text-(--ink-5)">·</span>
                  <span>{u.city}</span>
                </>
              )}
              <span className="text-(--ink-5)">·</span>
              <span>no Trapiche desde {u.joined}</span>
              {owner && profile.privacy && (
                <button
                  type="button"
                  onClick={() => setEditing("privacidade")}
                  className="ml-1 inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-[rgba(var(--ink-rgb),0.07)] text-(--ink-3) hover:bg-(--yellow-soft) hover:text-(--ink-2) cursor-pointer tracking-[0.04em] normal-case"
                >
                  <VisibilityIcon visibility={profile.visibility} />
                  {VISIBILITY_LABEL[profile.visibility]}
                </button>
              )}
            </div>
            {u.bio ? (
              <p className="m-0 mt-3 text-[14px] text-(--ink-3) leading-[1.55] max-w-130 whitespace-pre-line">
                {u.bio}
              </p>
            ) : (
              owner && (
                <button
                  type="button"
                  onClick={() => setEditing("perfil")}
                  className="mt-3 text-[13px] text-(--ink-4) hover:text-(--ink-2) cursor-pointer border-b border-dashed border-(--ink-5) pb-px"
                >
                  + Escrever uma bio
                </button>
              )
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {owner && (
            <button
              className={`${btn} bg-(--ink-2) text-(--cream) hover:bg-(--ink)`}
              onClick={() => setEditing("perfil")}
            >
              Editar perfil
            </button>
          )}
          {owner && (
            <Link
              href={`/u/${u.handle}?visitante=1`}
              className={`${btn} border border-[rgba(var(--ink-rgb),0.2)] text-(--ink-2) hover:bg-(--yellow-soft)`}
            >
              Ver como visitante
            </Link>
          )}
          {profile.access.sections.diary && (
            <Link
              href={`/u/${u.handle}/retrospectiva`}
              className={`${btn} border border-[rgba(var(--ink-rgb),0.2)] text-(--ink-2) hover:bg-(--yellow-soft)`}
            >
              Retrospectiva
            </Link>
          )}
          <button
            aria-label="Compartilhar perfil"
            className={`${btn} px-2.5 border border-[rgba(var(--ink-rgb),0.2)] text-(--ink-2) hover:bg-(--yellow-soft)`}
            onClick={() => shareLink(`/u/${u.handle}`, `${u.name} no Trapiche`)}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
              <path d="M16 6l-4-4-4 4" />
              <path d="M12 2v13" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`relative mt-7 grid rounded-2xl border border-[rgba(var(--ink-rgb),0.1)] bg-(--cream-card) overflow-hidden ${profile.stats.length === 5 ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2"}`}
      >
        {profile.stats.map((s, i) => {
          const cls = `py-3.5 px-4 sm:py-4 sm:px-5 border-[rgba(var(--ink-rgb),0.08)] ${i > 0 ? "sm:border-l" : ""} ${profile.stats.length === 5 ? `${i % 3 !== 0 ? "max-sm:border-l" : ""} ${i >= 3 ? "max-sm:border-t" : ""}` : i > 0 ? "max-sm:border-l" : ""}`;
          const body = (
            <>
              <div className="text-[24px] sm:text-[28px] font-extrabold tracking-[-0.03em] text-(--ink) leading-none tabular-nums">
                {s.value}
              </div>
              <div className="mt-1.5 font-mono text-[9.5px] sm:text-[10px] uppercase tracking-[0.08em] text-(--ink-4) leading-tight">
                {s.label}
              </div>
            </>
          );
          return s.href ? (
            <Link
              href={`/u/${u.handle}?tab=${s.href}${preview ? "&visitante=1" : ""}`}
              scroll={false}
              className={`${cls} transition-colors duration-150 hover:bg-(--yellow-soft)`}
              key={s.label}
            >
              {body}
            </Link>
          ) : (
            <div className={cls} key={s.label}>
              {body}
            </div>
          );
        })}
      </div>

      {editing && profile.privacy && (
        <EditProfileModal
          open
          onOpenChange={(open) => !open && setEditing(false)}
          initialTab={editing}
          user={{ name: u.name, handle: u.handle, bio: u.bio, city: u.city }}
          privacy={profile.privacy}
        />
      )}
    </section>
  );
}

export function VisibilityIcon({
  visibility,
}: {
  visibility: ProfileData["visibility"];
}) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {visibility === "PUBLIC" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </>
      ) : visibility === "MEMBERS" ? (
        <>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 20a6.5 6.5 0 0 0-3-5.5" />
        </>
      ) : (
        <>
          <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
          <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
        </>
      )}
    </svg>
  );
}
