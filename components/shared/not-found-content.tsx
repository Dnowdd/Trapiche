import Link from "next/link";
import StatusPage, { ghostBtn, primaryBtn } from "./status-page";

export default function NotFoundContent() {
  return (
    <StatusPage
      code="Erro 404"
      title="Essa página saiu da estante"
      actions={
        <>
          <Link href="/" className={primaryBtn}>
            Voltar ao início
          </Link>
          <Link href="/search" className={ghostBtn}>
            Buscar um livro
          </Link>
        </>
      }
    >
      O endereço pode ter mudado, ou o livro, a lista ou o perfil não existe
      mais.
    </StatusPage>
  );
}
