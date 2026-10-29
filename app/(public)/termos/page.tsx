import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "../_components/legal/legal-page";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Trapiche"
      title="Termos de uso"
      updated="29 de outubro de 2026"
    >
      <p>
        O Trapiche é um diário de leituras: você registra o que lê, escreve
        resenhas e monta listas. Ao criar uma conta, você concorda com estes
        termos.
      </p>

      <h2>Sua conta</h2>
      <p>
        Você é responsável pelo que publica e por manter sua senha em segurança.
        Use um nome de usuário que não se passe por outra pessoa.
      </p>

      <h2>O que você publica</h2>
      <p>
        Resenhas, notas, listas e anotações continuam sendo suas. Ao torná-las
        públicas, você permite que o Trapiche as exiba no site. Não publique
        conteúdo ilegal, discurso de ódio, assédio ou spoilers sem aviso.
        Podemos remover conteúdo que desrespeite essas regras.
      </p>

      <h2>Dados dos livros</h2>
      <p>
        Capas, títulos e informações das edições vêm do Google Books e da Open
        Library e podem ter erros. Os direitos sobre capas e textos pertencem
        aos autores e editoras.
      </p>

      <h2>Privacidade</h2>
      <p>
        Como tratamos seus dados está descrito na{" "}
        <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>Contato</h2>
      <p>
        Dúvidas ou pedidos:{" "}
        <a href="mailto:david.queiroz@dnowdd.com">david.queiroz@dnowdd.com</a>.
      </p>
    </LegalPage>
  );
}
