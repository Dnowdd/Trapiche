import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "../_components/legal/legal-page";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o Trapiche trata seus dados pessoais, de acordo com a LGPD.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Trapiche"
      title="Política de Privacidade"
      updated="6 de novembro de 2026"
    >
      <p>
        Esta página explica, em linguagem simples, quais dados o Trapiche
        guarda, por que guarda, o que fica público, com quem compartilha e como
        você exerce seus direitos pela Lei Geral de Proteção de Dados (LGPD, Lei
        13.709/2018).
      </p>

      <h2>Quem cuida dos seus dados</h2>
      <p>
        O controlador dos dados é David Queiroz, responsável pelo Trapiche. Para
        qualquer assunto de privacidade, inclusive pedidos da LGPD, fale pelo{" "}
        <Link prefetch={false} href="/suporte">
          suporte
        </Link>{" "}
        ou pelo e-mail{" "}
        <a href="mailto:david.queiroz@dnowdd.com">david.queiroz@dnowdd.com</a>.
      </p>

      <h2>O que guardamos</h2>
      <ul>
        <li>
          <strong>Conta:</strong> nome, e-mail, nome de usuário (@) e senha. A
          senha é guardada com hash; ninguém consegue lê-la. Se você entrar com
          o Google, recebemos do Google seu nome, e-mail e foto. Não recebemos
          sua senha do Google.
        </li>
        <li>
          <strong>Perfil:</strong> foto, bio e cidade, se você preencher, e suas
          escolhas de privacidade.
        </li>
        <li>
          <strong>Leituras:</strong> livros na estante, status, datas de início
          e término, sessões de leitura, páginas, minutos, anotações do diário,
          notas, resenhas, comentários, curtidas, favoritos, meta anual, listas,
          tags e citações.
        </li>
        <li>
          <strong>Importações:</strong> quando você importa um arquivo do
          Goodreads, do Skoob ou uma planilha, guardamos as linhas do arquivo
          (título, autor, ISBN, estante, nota, resenha, data e prateleiras) para
          processar a importação e mostrar o que não foi encontrado.
        </li>
        <li>
          <strong>Empréstimos:</strong> quando você anota que emprestou um
          livro, guardamos o nome que você digitar, as datas e a nota. Esses
          dados ficam só com você: ninguém mais vê, nem a pessoa citada. Use só
          o necessário para lembrar (um primeiro nome basta).
        </li>
        <li>
          <strong>Assistente (Prático):</strong> as conversas com o assistente
          (suas mensagens, as respostas, os livros mostrados e os cartões de
          confirmação) e um contador diário de mensagens e de uso.
        </li>
        <li>
          <strong>Suporte:</strong> os tickets, as mensagens e as imagens que
          você anexar.
        </li>
        <li>
          <strong>Notificações e e-mails:</strong> as notificações do site e
          suas preferências de e-mail (resumo do mês e lembrete de leitura).
        </li>
        <li>
          <strong>Desenvolvedores:</strong> se você criar chaves de API,
          guardamos o nome, o prefixo e um hash da chave, nunca a chave em si.
        </li>
        <li>
          <strong>Dados técnicos:</strong> um cookie de sessão que mantém você
          conectado, o endereço IP e o navegador da sessão. Não usamos cookies
          de publicidade nem rastreamento de terceiros.
        </li>
      </ul>

      <h2>Para que usamos e com qual base legal</h2>
      <ul>
        <li>
          <strong>Executar o serviço que você pediu</strong> (art. 7º, V): criar
          a conta, guardar sua estante e seu diário, mostrar suas resenhas,
          listas e citações, importar livros, responder às suas perguntas no
          assistente e responder o suporte.
        </li>
        <li>
          <strong>Legítimo interesse</strong> (art. 7º, IX): segurança da conta,
          limite de tentativas contra abuso, moderação de denúncias,
          monitoramento de erros e medição agregada de uso e velocidade para
          manter o site funcionando.
        </li>
        <li>
          <strong>Consentimento</strong> (art. 7º, I): e-mails opcionais (resumo
          do mês e lembrete de leitura), o login com Google e o uso dos dados da
          conta pelo assistente. Você pode desligar os e-mails a qualquer
          momento, no perfil ou pelo link em cada e-mail, e desmarcar o uso dos
          dados no próprio assistente.
        </li>
      </ul>

      <h2>O que fica público</h2>
      <p>
        Você escolhe. Em “Editar perfil → Privacidade”, seu perfil pode ser
        público, visível só para quem tem conta ou visível só para você. Você
        também escolhe se estante, diário, atividade, meta, curtidas e cidade
        aparecem para os outros, e se o perfil pode aparecer no Google.
      </p>
      <p>
        Independentemente disso, resenhas, comentários, citações não marcadas
        como “só para mim” e listas públicas aparecem nas páginas dos livros e
        das listas, com seu nome e sua foto. Listas privadas e tags marcadas
        como “só eu vejo” ficam só com você; listas compartilhadas, com quem
        participa delas.
      </p>

      <h2>Com quem compartilhamos</h2>
      <p>
        Não vendemos dados. Usamos estes fornecedores para operar o site, e cada
        um recebe só o necessário:
      </p>
      <ul>
        <li>
          <strong>Vercel:</strong> hospeda o site e processa as requisições.
          Também mede visitas e velocidade das páginas (Vercel Web Analytics e
          Speed Insights), de forma agregada, sem cookies e sem identificar
          você.
        </li>
        <li>
          <strong>Neon:</strong> hospeda o banco de dados, inclusive fotos e
          anexos do suporte.
        </li>
        <li>
          <strong>Resend:</strong> envia os e-mails (confirmação, senha, suporte
          e os opcionais que você ativar).
        </li>
        <li>
          <strong>Upstash:</strong> guarda por alguns minutos contadores de
          tentativas, ligados ao IP ou à conta, para impedir abuso.
        </li>
        <li>
          <strong>Sentry:</strong> recebe relatórios de erro, que podem incluir
          a página, o navegador e o identificador da conta. Não envia o conteúdo
          das suas resenhas.
        </li>
        <li>
          <strong>OpenAI:</strong> gera as respostas do Prático, só quando você
          usa o assistente. Veja os detalhes logo abaixo.
        </li>
        <li>
          <strong>Google:</strong> se você entrar com o Google, ele confirma sua
          identidade. O Google Books também fornece dados de alguns livros.
        </li>
        <li>
          <strong>Open Library:</strong> fornece capas e dados dos livros. As
          buscas saem do nosso servidor, sem seus dados pessoais.
        </li>
        <li>
          <strong>Lojas (Amazon, Estante Virtual, Google Play):</strong> os
          links de “Onde encontrar” só levam você até a busca da loja. Não
          enviamos seus dados a elas; o que acontece lá segue a política de cada
          loja.
        </li>
      </ul>
      <p>
        Alguns desses fornecedores processam dados fora do Brasil,
        principalmente nos Estados Unidos. Essas transferências seguem o art. 33
        da LGPD e os compromissos contratuais de proteção de cada um.
      </p>

      <h2 id="assistente">Assistente de leitura (Prático)</h2>
      <p>
        O Prático é opcional. Se você não usar, nada é enviado. Quando você
        manda uma mensagem, enviamos à OpenAI, que gera a resposta:
      </p>
      <ul>
        <li>a sua mensagem e as mensagens recentes daquela conversa;</li>
        <li>
          a data de hoje e, se você estiver na página de um livro, qual é o
          livro.
        </li>
      </ul>
      <p>
        Os dados da sua conta só vão junto se você marcar “Usar os dados da
        minha conta” no assistente. Com a opção marcada, enviamos também seu
        nome, seu @ e os dados que a pergunta pede, como livros da estante,
        notas, resenhas, citações, estatísticas, metas, desafios, listas e
        empréstimos (com o nome que você anotou). A opção começa desmarcada e
        você pode desmarcar a qualquer momento; a partir daí, nenhum dado da
        conta é enviado.
      </p>
      <p>
        Nunca enviamos seu e-mail, sua senha ou seu IP. Para a OpenAI, sua conta
        aparece só como um código irreversível, usado para evitar abuso. Pedimos
        que ela não guarde as respostas. Pelas regras da API da OpenAI, esses
        dados não são usados para treinar modelos e podem ficar guardados por
        até 30 dias para monitorar abuso, sendo apagados depois.
      </p>
      <p>
        O assistente só muda a sua conta quando você confirma um cartão. As
        conversas ficam guardadas no Trapiche para você voltar a elas, e só você
        vê. Dá para apagar uma conversa ou todas, quando quiser, na página do{" "}
        <Link prefetch={false} href="/assistente">
          Prático
        </Link>
        . As respostas são automáticas e podem ter erros.
      </p>

      <h2>Por quanto tempo</h2>
      <p>
        Guardamos seus dados enquanto a conta existir. Ao excluir a conta,
        apagamos na hora o perfil, a foto, a estante, o diário, as resenhas, as
        citações, as tags, as listas que você criou, as importações, as
        conversas com o assistente, as notificações e os tickets de suporte com
        os anexos. Cópias de segurança automáticas do banco podem manter esses
        dados por poucos dias, até serem sobrescritas. Relatórios de erro
        expiram conforme a retenção do Sentry, de até 90 dias.
      </p>

      <h2>Seus direitos</h2>
      <p>Pela LGPD, você pode, a qualquer momento:</p>
      <ul>
        <li>
          <strong>Acessar e levar seus dados:</strong> em “Editar perfil →
          Conta”, baixe um arquivo JSON com tudo o que está ligado a você,
          inclusive suporte, citações, tags, importações, empréstimos, desafios,
          conversas com o assistente e a sua foto. Também dá para baixar a
          estante em CSV, no formato do Goodreads, para levar para outro app.
        </li>
        <li>
          <strong>Corrigir:</strong> edite perfil, leituras, resenhas e listas
          pelo próprio site.
        </li>
        <li>
          <strong>Limitar o que aparece:</strong> ajuste a privacidade do perfil
          e de cada citação, tag ou lista.
        </li>
        <li>
          <strong>Revogar consentimentos:</strong> desligue os e-mails opcionais
          e desconecte o Google na sua conta Google.
        </li>
        <li>
          <strong>Excluir:</strong> em “Editar perfil → Conta”, apague a conta
          de vez.
        </li>
        <li>
          <strong>Pedir informações</strong> sobre o tratamento e{" "}
          <strong>reclamar</strong> à Autoridade Nacional de Proteção de Dados
          (ANPD), se achar que algo está errado.
        </li>
      </ul>
      <p>
        Se precisar de ajuda com qualquer pedido, fale com a gente pelo{" "}
        <Link prefetch={false} href="/suporte">
          suporte
        </Link>{" "}
        ou por{" "}
        <a href="mailto:david.queiroz@dnowdd.com">david.queiroz@dnowdd.com</a>.
        Respondemos em até 15 dias.
      </p>
    </LegalPage>
  );
}
