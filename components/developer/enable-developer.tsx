"use client";

import { useState } from "react";
import { Button, FormError } from "@/components/shared/form";
import { useAction } from "@/components/reading/use-action";
import { becomeDeveloper } from "@/lib/actions/developer";

export default function EnableDeveloper() {
  const [agree, setAgree] = useState(false);
  const { pending, error, run } = useAction();
  return (
    <div className="rounded-[18px] border border-(--yellow-deep) bg-(--yellow-soft) p-5 sm:p-7">
      <h2 className="m-0 text-[20px] font-extrabold tracking-[-0.02em] text-(--ink)">
        Ative o acesso de desenvolvedor
      </h2>
      <p className="m-0 mt-2 text-[14px] text-(--ink-3) leading-[1.55] max-w-150">
        Com uma chave de API você lê os seus dados do Trapiche (estante,
        leituras e listas) a partir do seu próprio código. A API é{" "}
        <strong className="text-(--ink-2)">só de leitura</strong> e está em
        beta.
      </p>
      <ul className="m-0 mt-4 pl-5 text-[13px] text-(--ink-3) leading-[1.7]">
        <li>Use a chave só no servidor e nunca a publique.</li>
        <li>A chave dá acesso aos seus dados e às listas que você pode ver.</li>
        <li>Respeite os limites de requisições e não revenda os dados.</li>
        <li>
          Ao exibir livros, cite a fonte (Open Library ou Google Books) e o
          Trapiche.
        </li>
      </ul>
      <FormError message={error} />
      <label className="mt-5 flex items-center gap-2.5 text-[13px] text-(--ink-2) cursor-pointer">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="w-4 h-4 accent-(--ink-2)"
        />
        Li e concordo com essas regras.
      </label>
      <Button
        className="mt-4"
        disabled={!agree}
        loading={pending}
        onClick={() => run(() => becomeDeveloper())}
      >
        Ativar acesso
      </Button>
    </div>
  );
}
