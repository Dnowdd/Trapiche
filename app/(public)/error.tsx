"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import StatusPage, {
  ghostBtn,
  primaryBtn,
} from "@/components/shared/status-page";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <StatusPage
      code="Erro"
      title="Algo deu errado por aqui"
      actions={
        <>
          <button type="button" onClick={reset} className={primaryBtn}>
            Tentar de novo
          </button>
          <Link href="/" className={ghostBtn}>
            Voltar ao início
          </Link>
        </>
      }
    >
      Já fomos avisados do erro. Tente de novo em instantes.
    </StatusPage>
  );
}
