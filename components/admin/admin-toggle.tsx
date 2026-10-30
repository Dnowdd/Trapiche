"use client";

import { Button } from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { setAdmin } from "@/lib/actions/admin";

export default function AdminToggle({
  userId,
  handle,
  isAdmin,
  self,
}: {
  userId: string;
  handle: string;
  isAdmin: boolean;
  self: boolean;
}) {
  const { pending, run } = useAction();
  return (
    <Button
      variant={isAdmin ? "danger" : "ghost"}
      className="h-8 px-3 text-[12px]"
      loading={pending}
      onClick={() => {
        const question = isAdmin
          ? self
            ? "Remover seu próprio acesso de admin? Você perde acesso a este painel."
            : `Remover o acesso de admin de @${handle}?`
          : `Tornar @${handle} admin? A pessoa poderá ver tickets, denúncias e usuários.`;
        if (!window.confirm(question)) return;
        run(
          () => setAdmin(userId, !isAdmin),
          () => toast(isAdmin ? "Acesso de admin removido." : "Agora é admin."),
          toast,
        );
      }}
    >
      {isAdmin ? "Remover admin" : "Tornar admin"}
    </Button>
  );
}
