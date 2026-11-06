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
      updated="7 de novembro de 2026"
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
        <Link href="/suporte">suporte</Link> ou pelo e-mail{" "}
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
          listas e citações, importar livros e responder o suporte.
        </li>
        <li>
          <strong>Legítimo interesse</strong> (art. 7º, IX): segurança da conta,
          limite de tentativas contra abuso, moderação de denúncias,
          monitoramento de erros e medição agregada de uso e velocidade para
          manter o site funcionando.
        </li>
        <li>
          <strong>Consentimento</strong> (art. 7º, I): e-mails opcionais (resumo
          do mês e lembrete de leitura) e o login com Google. Você pode desligar
          os e-mails a qualquer momento, no perfil ou pelo link em cada e-mail.
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
          <strong>Google:</strong> se você entrar com o Google, ele confirma sua
          identidade. O Google Books também fornece dados de alguns livros.
        </li>
        <li>
          <strong>Open Library:</strong> fornece capas e dados dos livros. As
          buscas saem do nosso servidor, sem seus dados pessoais.
        </li>
      </ul>
      <p>
        Alguns desses fornecedores processam dados fora do Brasil,
        principalmente nos Estados Unidos. Essas transferências seguem o art. 33
        da LGPD e os compromissos contratuais de proteção de cada um.
      </p>

      <h2>Por quanto tempo</h2>
      <p>
        Guardamos seus dados enquanto a conta existir. Ao excluir a conta,
        apagamos na hora o perfil, a foto, a estante, o diário, as resenhas, as
        citações, as tags, as listas que você criou, as importações, as
        notificações e os tickets de suporte com os anexos. Cópias de segurança
        automáticas do banco podem manter esses dados por poucos dias, até serem
        sobrescritas. Relatórios de erro expiram conforme a retenção do Sentry,
        de até 90 dias.
      </p>

      <h2>Seus direitos</h2>
      <p>Pela LGPD, você pode, a qualquer momento:</p>
      <ul>
        <li>
          <strong>Acessar e levar seus dados:</strong> em “Editar perfil →
          Conta”, baixe um arquivo JSON com tudo o que está ligado a você,
          inclusive suporte, citações, tags, importações e a sua foto.
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
        <Link href="/suporte">suporte</Link> ou por{" "}
        <a href="mailto:david.queiroz@dnowdd.com">david.queiroz@dnowdd.com</a>.
        Respondemos em até 15 dias.
      </p>
    </LegalPage>
  );
}
