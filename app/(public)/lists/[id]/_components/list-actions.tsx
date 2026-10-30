"use client";

import { loginHref } from "@/lib/links";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { shareLink } from "@/components/reading/share";
import ListFormModal from "@/components/lists/list-form-modal";
import {
  deleteList,
  leaveList,
  toggleListFollow,
  toggleListPin,
} from "@/lib/actions/lists";
import type { ListPageData } from "@/lib/queries/lists";
import MembersModal from "./members-modal";

export default function ListActions({ list }: { list: ListPageData }) {
  const router = useRouter();
  const [modal, setModal] = useState<null | "edit" | "members">(null);
  const { pending, run } = useAction();
  const v = list.viewer;
  const small = "h-9 px-3.5 text-[12px]";

  return (
    <div className="flex gap-2 flex-wrap md:justify-end">
      {!v.isMember && list.visibility === "PUBLIC" && (
        <Button
          className={small}
          variant={v.following ? "ghost" : "primary"}
          loading={pending}
          onClick={() =>
            v.loggedIn
              ? run(() => toggleListFollow(list.id), undefined, toast)
              : router.push(loginHref())
          }
        >
          {v.following ? "Seguindo ✓" : "Seguir lista"}
        </Button>
      )}
      {v.isMember && (
        <Button
          className={small}
          variant="ghost"
          disabled={pending}
          onClick={() => run(() => toggleListPin(list.id), undefined, toast)}
        >
          {v.pinned ? "Desafixar" : "◉ Fixar no perfil"}
        </Button>
      )}
      {v.isOwner && list.visibility === "SHARED" && (
        <Button
          className={small}
          variant="ghost"
          onClick={() => setModal("members")}
        >
          Pessoas · {list.members.length}
        </Button>
      )}
      {list.visibility !== "PRIVATE" && (
        <Button
          className={small}
          variant="ghost"
          onClick={() => shareLink(`/lists/${list.id}`, list.title)}
        >
          Compartilhar
        </Button>
      )}
      {v.isOwner && (
        <>
          <Button
            className={small}
            variant="yellow"
            onClick={() => setModal("edit")}
          >
            Editar
          </Button>
          <Button
            className={small}
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (
                !window.confirm(
                  `Apagar a lista “${list.title}”? Isso não pode ser desfeito.`,
                )
              )
                return;
              run(
                () => deleteList(list.id),
                () => {
                  toast("Lista apagada.");
                  router.push(`/u/${list.owner.handle}?tab=listas`);
                },
                toast,
              );
            }}
          >
            Apagar
          </Button>
        </>
      )}
      {v.isMember && !v.isOwner && (
        <Button
          className={small}
          variant="danger"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Sair dessa lista compartilhada?")) return;
            run(
              () => leaveList(list.id),
              () => router.push("/profile?tab=listas"),
              toast,
            );
          }}
        >
          Sair da lista
        </Button>
      )}

      {modal === "edit" && (
        <ListFormModal
          open
          onOpenChange={(o) => !o && setModal(null)}
          list={{
            id: list.id,
            title: list.title,
            note: list.note,
            visibility: list.visibility,
          }}
        />
      )}
      {modal === "members" && (
        <MembersModal
          open
          onOpenChange={(o) => !o && setModal(null)}
          list={list}
        />
      )}
    </div>
  );
}
