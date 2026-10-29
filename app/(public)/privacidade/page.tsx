import type { Metadata } from "next";
import LegalPage from "../_components/legal/legal-page";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Trapiche"
      title="Política de Privacidade"
      updated="29 de outubro de 2026"
    >
      <p>
        Esta página explica, em linguagem simples, quais dados o Trapiche
        guarda, o que fica público e como você pode pedir a exclusão.
      </p>

      <h2>O que guardamos</h2>
      <ul>
        <li>
          <strong>Conta:</strong> nome, e-mail, nome de usuário (@) e senha. A
          senha é guardada de forma criptografada; ninguém consegue lê-la.
        </li>
        <li>
          <strong>Perfil:</strong> bio e cidade, se você preencher.
        </li>
        <li>
          <strong>Leituras:</strong> livros na sua estante, status, datas de
          início e término, sessões de leitura, páginas, anotações, notas,
          resenhas, curtidas, favoritos e listas.
        </li>
        <li>
          <strong>Sessão:</strong> um cookie que mantém você conectado. Não
          usamos cookies de publicidade nem rastreamento de terceiros.
        </li>
      </ul>

      <h2>O que fica público</h2>
      <p>
        Seu perfil (nome, @, bio, cidade), sua estante, seu diário de leitura,
        suas resenhas, curtidas e as listas marcadas como públicas podem ser
        vistos por qualquer pessoa, inclusive sem conta. Listas privadas só
        aparecem para você; listas compartilhadas, para quem participa delas.
      </p>

      <h2>Serviços de terceiros</h2>
      <ul>
        <li>
          <strong>Google Books e Open Library:</strong> usamos para buscar capas
          e dados dos livros. As buscas saem do nosso servidor e não levam seus
          dados pessoais.
        </li>
        <li>
          <strong>Resend:</strong> envia os e-mails de confirmação de conta e de
          redefinição de senha.
        </li>
        <li>
          <strong>Neon:</strong> hospeda o banco de dados onde tudo isso fica
          guardado.
        </li>
      </ul>

      <h2>Seus direitos</h2>
      <p>
        Você pode editar seu perfil, apagar resenhas, remover livros da estante
        e excluir listas a qualquer momento pelo próprio site. Em “Editar
        perfil” você baixa uma cópia de todos os seus dados ou exclui sua conta
        de vez. Dúvidas:{" "}
        <a href="mailto:david.queiroz@dnowdd.com">david.queiroz@dnowdd.com</a>.
      </p>
    </LegalPage>
  );
}
