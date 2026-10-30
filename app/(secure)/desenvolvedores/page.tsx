import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { getDeveloper } from "@/lib/queries/developer";
import SupportShell from "@/components/support/shell";
import EnableDeveloper from "@/components/developer/enable-developer";
import ApiKeys from "@/components/developer/api-keys";
import ApiDocs from "@/components/developer/api-docs";

export const metadata: Metadata = { title: "Desenvolvedores" };

export default async function DevelopersPage() {
  const session = await requireSession();
  const data = await getDeveloper(session.user.id);

  return (
    <SupportShell eyebrow="API · beta" title="Desenvolvedores">
      <p className="m-0 -mt-2 mb-6 text-[14px] text-(--ink-3) max-w-150 leading-[1.55]">
        Leia sua estante, suas leituras e suas listas do Trapiche a partir do
        seu código. Só leitura, com chave de API.
      </p>
      {data.enabled ? <ApiKeys keys={data.keys} /> : <EnableDeveloper />}
      <ApiDocs />
    </SupportShell>
  );
}
