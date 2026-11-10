import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "../_components/legal/legal-page";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Os termos de uso do Trapiche, o diário de leituras.",
  alternates: { canonical: "/termos" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Trapiche"
      title="Termos de uso"
      updated="6 de novembro de 2026"
    >
      <p>
        O Trapiche é um diário de leituras: você registra o que lê, guarda
        citações, escreve resenhas e monta listas. Ao criar uma conta ou usar o
        site, você concorda com estes termos. Eles valem junto com a{" "}
        <Link prefetch={false} href="/privacidade">
          Política de Privacidade
        </Link>
        .
      </p>

      <h2>Quem pode usar</h2>
      <p>
        Você precisa ter pelo menos 13 anos. Se tiver menos de 18, use com o
        conhecimento de quem é responsável por você. O Trapiche é gratuito e
        pode mudar, ganhar ou perder funções com o tempo.
      </p>

      <h2>Sua conta</h2>
      <ul>
        <li>
          Você é responsável pelo que acontece na sua conta e por manter a senha
          (ou o acesso ao Google) em segurança.
        </li>
        <li>
          Use um nome e um @ que não se passem por outra pessoa, autor ou
          editora.
        </li>
        <li>Uma pessoa, uma conta. Contas automatizadas não são permitidas.</li>
      </ul>

      <h2>O que você publica</h2>
      <p>
        Resenhas, comentários, citações, listas, tags e anotações continuam
        sendo seus. Ao torná-los públicos, você permite que o Trapiche os exiba,
        inclusive em imagens de compartilhamento e em buscadores, enquanto
        estiverem publicados. Você pode apagar ou tornar privado a qualquer
        momento.
      </p>
      <p>Não é permitido publicar:</p>
      <ul>
        <li>conteúdo ilegal, discurso de ódio, assédio ou ameaças;</li>
        <li>spoilers sem marcar a resenha como spoiler;</li>
        <li>spam, propaganda ou links para pirataria;</li>
        <li>dados pessoais de outras pessoas.</li>
      </ul>
      <p>
        Qualquer pessoa pode denunciar um conteúdo. A moderação pode ocultar
        conteúdo que desrespeite estas regras e, em casos graves ou repetidos,
        suspender a conta.
      </p>

      <h2>Citações e direitos autorais</h2>
      <p>
        A lei brasileira permite citar trechos curtos de obras, indicando o
        autor e a origem (Lei 9.610/1998, art. 46, III). Por isso:
      </p>
      <ul>
        <li>
          guarde trechos curtos, do tamanho de uma citação, nunca capítulos ou
          páginas inteiras;
        </li>
        <li>
          o Trapiche sempre mostra o livro e o autor junto de cada citação;
        </li>
        <li>
          se você é autor ou editora e acha que um conteúdo viola seus direitos,
          fale com a gente pelo e-mail abaixo. Removemos o que for indevido.
        </li>
      </ul>

      <h2>Dados dos livros</h2>
      <p>
        Capas, títulos e informações das edições vêm da Open Library e do Google
        Books e podem ter erros. Use o link “Dados errados?” na página do livro
        para avisar. Os direitos sobre capas, textos e marcas pertencem aos
        autores e editoras.
      </p>

      <h2>Links de compra</h2>
      <p>
        A página de cada livro tem links para lojas e sebos. Alguns podem ser
        links de afiliado: se você comprar por eles, o Trapiche pode ganhar uma
        comissão, sem custo extra para você. Isso nunca muda o que aparece nas
        buscas, nas notas ou nas recomendações.
      </p>

      <h2>Importação</h2>
      <p>
        Ao importar um arquivo do Goodreads, do Skoob ou de outra planilha, você
        confirma que os dados são seus. O Trapiche usa o arquivo só para montar
        a sua estante.
      </p>

      <h2>Assistente de leitura (Prático)</h2>
      <ul>
        <li>
          O Prático é um assistente feito com inteligência artificial. As
          respostas são geradas automaticamente e podem ter erros, inclusive
          sobre livros, autores e datas. Confira o que for importante.
        </li>
        <li>
          Ele só muda a sua conta quando você toca em “Confirmar” num cartão.
          Leia o cartão antes de confirmar.
        </li>
        <li>
          Use o assistente para assuntos de leitura. Não tente fazê-lo gerar
          conteúdo ilegal, ofensivo ou que viole direitos de terceiros, nem
          contornar os limites de uso. Há um limite diário de mensagens por
          conta.
        </li>
        <li>
          Como seus dados são usados no assistente está na{" "}
          <Link prefetch={false} href="/privacidade#assistente">
            Política de Privacidade
          </Link>
          .
        </li>
      </ul>

      <h2>API e chaves de desenvolvedor</h2>
      <ul>
        <li>
          As chaves são pessoais. Não compartilhe nem publique. Chaves com
          permissão de escrita alteram sua conta como se fossem você.
        </li>
        <li>
          Respeite os limites de requisições, não revenda os dados e cite a
          fonte dos livros (Open Library ou Google Books) e o Trapiche ao
          exibi-los.
        </li>
        <li>
          Podemos revogar chaves usadas de forma abusiva ou que prejudiquem o
          serviço.
        </li>
      </ul>

      <h2>Garantias e responsabilidade</h2>
      <p>
        O Trapiche é oferecido como está. Fazemos o possível para manter o site
        no ar e seus dados seguros, mas podem acontecer falhas. Baixe uma cópia
        dos seus dados quando quiser em “Editar perfil → Conta”. Não nos
        responsabilizamos por conteúdo publicado por outras pessoas.
      </p>

      <h2>Encerramento</h2>
      <p>
        Você pode excluir sua conta a qualquer momento. Podemos encerrar contas
        que violem estes termos, avisando por e-mail quando possível.
      </p>

      <h2>Mudanças nestes termos</h2>
      <p>
        Se os termos mudarem de forma importante, avisamos no site ou por e-mail
        antes de valerem. A data no topo mostra a última atualização.
      </p>

      <h2>Contato</h2>
      <p>
        Dúvidas, pedidos ou avisos de direitos autorais: pelo{" "}
        <Link prefetch={false} href="/suporte">
          suporte
        </Link>{" "}
        ou por{" "}
        <a href="mailto:david.queiroz@dnowdd.com">david.queiroz@dnowdd.com</a>.
        Estes termos seguem as leis do Brasil.
      </p>
    </LegalPage>
  );
}
