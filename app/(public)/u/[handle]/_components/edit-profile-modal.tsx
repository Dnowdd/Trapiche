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
import { updateProfile } from "@/lib/actions/profile";

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
        <div className="grid grid-cols-2 gap-3.5">
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
    </Modal>
  );
}
