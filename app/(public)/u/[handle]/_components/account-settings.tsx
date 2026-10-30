"use client";

import { useState } from "react";
import {
  Button,
  FormError,
  FormField,
  TextInput,
} from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { authClient, useSession } from "@/lib/auth-client";
import { authErrorMessage } from "@/app/auth/_components/errors";
import PasswordStrength, {
  scorePassword,
} from "@/app/auth/_components/password-strength";

const sectionTitle =
  "font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase mb-3";

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next.length < 8)
      return setError("A senha nova precisa ter pelo menos 8 caracteres.");
    if (next !== confirm) return setError("As senhas novas não são iguais.");
    if (next === current)
      return setError("A senha nova precisa ser diferente da atual.");
    setPending(true);
    const { error: err } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (err)
      return setError(
        err.code === "INVALID_PASSWORD"
          ? "A senha atual está incorreta."
          : authErrorMessage(err, "Não deu pra trocar a senha agora."),
      );
    setCurrent("");
    setNext("");
    setConfirm("");
    toast("Senha alterada. Outros aparelhos foram desconectados.");
  };

  return (
    <form onSubmit={submit}>
      <div className={sectionTitle}>Trocar senha</div>
      <FormError message={error} />
      <FormField label="Senha atual">
        <TextInput
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </FormField>
      <div className="grid sm:grid-cols-2 gap-x-3.5">
        <FormField label="Senha nova" className="mb-2">
          <TextInput
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </FormField>
        <FormField label="Repita a senha nova" className="mb-2">
          <TextInput
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </FormField>
      </div>
      <PasswordStrength pw={next} score={scorePassword(next)} />
      <div className="mt-4 flex justify-end">
        <Button type="submit" loading={pending}>
          Trocar senha
        </Button>
      </div>
    </form>
  );
}

function EmailForm() {
  const { data } = useSession();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState<{ to: string; viaOld: boolean } | null>(
    null,
  );
  const current = data?.user.email ?? "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const newEmail = email.trim().toLowerCase();
    if (newEmail === current) return setError("Esse já é o seu e-mail.");
    setPending(true);
    const { error: err } = await authClient.changeEmail({
      newEmail,
      callbackURL: "/profile",
    });
    setPending(false);
    if (err)
      return setError(
        authErrorMessage(err, "Não deu pra trocar o e-mail agora."),
      );
    setSent(
      data?.user.emailVerified
        ? { to: current, viaOld: true }
        : { to: newEmail, viaOld: false },
    );
    setEmail("");
  };

  return (
    <form onSubmit={submit}>
      <div className={sectionTitle}>Trocar e-mail</div>
      <p className="m-0 mb-3 text-[13px] text-(--ink-3)">
        E-mail atual:{" "}
        <strong className="text-(--ink-2) font-semibold">
          {current || "…"}
        </strong>
      </p>
      {sent ? (
        <div className="rounded-[10px] bg-(--yellow-soft) border border-(--yellow-deep) px-3.5 py-3 text-[13px] text-(--ink-2) leading-normal">
          Mandamos um link para <strong>{sent.to}</strong>.{" "}
          {sent.viaOld
            ? "Aprove a troca por lá e depois confirme o novo endereço."
            : "Confirme por lá pra concluir a troca."}{" "}
          Até lá, nada muda.
        </div>
      ) : (
        <>
          <FormError message={error} />
          <div className="flex flex-col sm:flex-row gap-2.5 sm:items-start">
            <TextInput
              type="email"
              autoComplete="email"
              required
              aria-label="Novo e-mail"
              placeholder="novo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="ghost" loading={pending}>
              Trocar e-mail
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

export default function AccountSettings() {
  return (
    <div className="flex flex-col gap-7">
      <EmailForm />
      <div className="h-px bg-(--rule)" />
      <PasswordForm />
    </div>
  );
}
