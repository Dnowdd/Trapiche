"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/shared/modal";
import {
  Button,
  FormActions,
  FormError,
  FormField,
  TextArea,
  TextInput,
} from "@/components/shared/form";
import { useAction } from "@/components/reading/use-action";
import { toast } from "@/components/shared/toast";
import { deleteAccount, updateProfile } from "@/lib/actions/profile";
import { signOut } from "@/lib/auth-client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    name: string;
    handle: string;
    bio: string | null;
    city: string | null;
  };
}

export default function EditProfileModal({ open, onOpenChange, user }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [city, setCity] = useState(user.city ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const { pending, error, run } = useAction();
  const removing = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () => updateProfile({ name, handle, city, bio }),
      (data) => {
        onOpenChange(false);
        toast("Perfil atualizado.");
        if (data && data.handle !== user.handle)
          router.replace(`/u/${data.handle}`);
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Seu perfil"
      title="Editar perfil"
      width={540}
    >
      <form onSubmit={submit}>
        <FormError message={error} />
        <div className="grid sm:grid-cols-2 gap-x-3.5">
          <FormField label="Nome">
            <TextInput
              value={name}
              maxLength={60}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField label="Usuário" hint="Muda o endereço do seu perfil.">
            <TextInput
              value={handle}
              maxLength={30}
              required
              onChange={(e) => setHandle(e.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Cidade" hint="Opcional">
          <TextInput
            value={city}
            maxLength={60}
            placeholder="Salvador · BA"
            onChange={(e) => setCity(e.target.value)}
          />
        </FormField>
        <FormField label="Bio" hint={`Opcional · ${bio.length}/400`}>
          <TextArea
            value={bio}
            maxLength={400}
            placeholder="O que você gosta de ler?"
            onChange={(e) => setBio(e.target.value)}
          />
        </FormField>
        <FormActions>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            Salvar
          </Button>
        </FormActions>
      </form>

      <section className="mt-7 pt-5 border-t border-(--rule)">
        <div className="font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase mb-2">
          Seus dados
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <a
            href="/api/me/export"
            className="h-9 px-3.5 rounded-[10px] border border-[rgba(67,62,18,0.2)] text-[12px] font-medium text-(--ink-2) inline-flex items-center justify-center hover:bg-(--yellow-soft)"
          >
            Baixar meus dados (JSON)
          </a>
          <button
            type="button"
            disabled={removing.pending}
            className="h-9 px-3.5 rounded-[10px] border border-[rgba(154,74,42,0.35)] text-[12px] font-medium text-[#9a4a2a] cursor-pointer hover:bg-[rgba(154,74,42,0.06)] disabled:cursor-wait"
            onClick={() => {
              const typed = window.prompt(
                `Isso apaga sua conta, sua estante, suas leituras, resenhas e listas. Não dá pra desfazer.\n\nDigite @${user.handle} para confirmar:`,
              );
              if (typed == null) return;
              removing.run(
                () => deleteAccount(typed),
                async () => {
                  await signOut().catch(() => {});
                  router.replace("/");
                  toast("Sua conta foi excluída.");
                },
                toast,
              );
            }}
          >
            Excluir minha conta
          </button>
        </div>
      </section>
    </Modal>
  );
}
