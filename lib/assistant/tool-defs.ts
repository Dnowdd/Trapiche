import type { FunctionTool } from "openai/resources/responses/responses";
import { CHALLENGE_KINDS } from "../challenges";

type Schema = Record<string, unknown>;

const str = (description: string): Schema => ({ type: "string", description });
const nullable = (schema: Schema): Schema => ({
  ...schema,
  type: [schema.type as string, "null"],
  ...(Array.isArray(schema.enum) ? { enum: [...schema.enum, null] } : {}),
});
const int = (description: string): Schema => ({ type: "integer", description });
const num = (description: string): Schema => ({ type: "number", description });
const obj = (properties: Record<string, Schema>): Schema => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export const SHELF_STATUSES = [
  "WANT",
  "READING",
  "READ",
  "ABANDONED",
  "REREADING",
];

function tool(
  name: string,
  description: string,
  parameters: Schema,
): FunctionTool {
  return { type: "function", name, description, parameters, strict: true };
}

export const TOOLS: FunctionTool[] = [
  tool(
    "search_books",
    "Busca livros no catálogo do Trapiche (Open Library e Google Books). Use para achar o id de um livro antes de mostrar, recomendar ou propor ações. Retorna até 8 obras.",
    obj({
      query: str(
        "Título, autor, ISBN ou tema. Ex.: 'torto arado', 'clarice lispector'.",
      ),
    }),
  ),
  tool(
    "get_book",
    "Detalhes de um livro pelo id: sinopse, autores, páginas, ano, nota média da comunidade e a relação do usuário com ele (status, progresso, nota, citações).",
    obj({ book_id: str("Id do livro, vindo de outra ferramenta.") }),
  ),
  tool(
    "get_my_shelf",
    "Estante do usuário: livros por status, com nota, tags, progresso, data de término e empréstimo.",
    obj({
      status: nullable({
        type: "string",
        enum: SHELF_STATUSES,
        description: "Filtra por status. null = todos.",
      }),
      query: nullable(str("Filtra por título ou autor.")),
      limit: int("Máximo de livros (1 a 60)."),
    }),
  ),
  tool(
    "get_reading_now",
    "Livros que o usuário está lendo agora, com formato (físico, e-book, audiolivro), progresso e previsão de término.",
    obj({}),
  ),
  tool(
    "get_reading_stats",
    "Estatísticas de leitura de um ano ou mês: livros terminados, páginas, horas, dias lendo, sequência, autores e gêneros mais lidos, notas, idiomas, formatos e meta anual.",
    obj({
      year: nullable(int("Ano. null = ano atual.")),
      month: nullable(int("Mês de 1 a 12. null = o ano inteiro.")),
    }),
  ),
  tool(
    "get_my_reviews_and_quotes",
    "Resenhas (notas e textos) e citações guardadas pelo usuário. Pode filtrar por um livro.",
    obj({ book_id: nullable(str("Id do livro ou null para todos.")) }),
  ),
  tool(
    "get_recommendations",
    "Recomendações personalizadas do Trapiche a partir da estante do usuário (co-leitores, autores que ele lê, populares), cada uma com o motivo.",
    obj({}),
  ),
  tool(
    "get_goals_challenges_loans",
    "Meta anual, desafios de leitura (com progresso), empréstimos em aberto e listas do usuário.",
    obj({}),
  ),
  tool(
    "show_books",
    "Mostra capas clicáveis de livros na conversa. Use sempre que recomendar ou citar livros específicos. Só use ids que vieram de outras ferramentas.",
    obj({
      book_ids: {
        type: "array",
        items: { type: "string" },
        description: "Ids dos livros (1 a 8).",
      },
      title: nullable(
        str("Título curto do bloco. Ex.: 'Curtos e brasileiros'."),
      ),
    }),
  ),
  tool(
    "propose_shelf_status",
    "Propõe colocar um livro na estante como 'Quero ler' (WANT) ou 'Lendo' (READING). Para marcar como lido use propose_finish_book. O usuário confirma antes.",
    obj({
      book_id: str("Id do livro."),
      status: {
        type: "string",
        enum: ["WANT", "READING"],
        description: "Novo status.",
      },
    }),
  ),
  tool(
    "propose_finish_book",
    "Propõe marcar um livro como lido, opcionalmente com nota (0,5 a 5) e resenha. O usuário confirma antes.",
    obj({
      book_id: str("Id do livro."),
      rating: nullable(num("Nota de 0,5 a 5, em passos de 0,5.")),
      review: nullable(str("Texto da resenha, nas palavras do usuário.")),
      finished_on: nullable(str("Data de término AAAA-MM-DD. null = hoje.")),
    }),
  ),
  tool(
    "propose_log_session",
    "Propõe registrar uma sessão de leitura de um livro que o usuário está lendo. Informe o campo do formato do livro: page_end (físico), percent_end (e-book) ou audio_position_minutes (audiolivro).",
    obj({
      book_id: str("Id do livro."),
      minutes: int("Minutos de leitura (1 a 1440)."),
      page_end: nullable(int("Página onde parou.")),
      percent_end: nullable(num("Porcentagem onde parou no e-book (0 a 100).")),
      audio_position_minutes: nullable(
        int("Minutos ouvidos até agora no audiolivro."),
      ),
      date: nullable(str("Data AAAA-MM-DD. null = hoje.")),
    }),
  ),
  tool(
    "propose_review",
    "Propõe salvar ou atualizar a avaliação do usuário para um livro. O usuário confirma antes.",
    obj({
      book_id: str("Id do livro."),
      rating: num("Nota de 0,5 a 5, em passos de 0,5."),
      text: nullable(str("Texto da resenha, nas palavras do usuário.")),
    }),
  ),
  tool(
    "propose_quote",
    "Propõe guardar uma citação (trecho curto) de um livro, exatamente como o usuário escreveu. O usuário confirma antes.",
    obj({
      book_id: str("Id do livro."),
      text: str("O trecho."),
      page: nullable(int("Página.")),
    }),
  ),
  tool(
    "propose_create_list",
    "Propõe criar uma lista de livros com os livros indicados. O usuário confirma antes.",
    obj({
      title: str("Nome da lista."),
      note: nullable(str("Descrição curta.")),
      visibility: {
        type: "string",
        enum: ["PUBLIC", "PRIVATE"],
        description: "Pública ou privada.",
      },
      book_ids: {
        type: "array",
        items: { type: "string" },
        description: "Ids dos livros (até 30).",
      },
    }),
  ),
  tool(
    "propose_add_to_list",
    "Propõe adicionar livros a uma lista existente do usuário. O usuário confirma antes.",
    obj({
      list_id: str("Id da lista, vindo de get_goals_challenges_loans."),
      book_ids: {
        type: "array",
        items: { type: "string" },
        description: "Ids dos livros (até 30).",
      },
    }),
  ),
  tool(
    "propose_goal",
    "Propõe definir a meta anual de livros. O usuário confirma antes.",
    obj({ year: int("Ano."), target: int("Quantidade de livros (1 a 1000).") }),
  ),
  tool(
    "propose_challenge",
    "Propõe criar um desafio de leitura. kind: ANY (qualquer livro), AUTHOR (value = nome do autor), LANGUAGE (value = pt, en, es ou fr), FORMAT (value = PRINT, EBOOK ou AUDIO), LONG (400+ páginas), SHORT (até 200 páginas). O usuário confirma antes.",
    obj({
      title: str("Nome do desafio."),
      kind: {
        type: "string",
        enum: CHALLENGE_KINDS.filter((k) => k !== "TAG"),
        description: "Tipo.",
      },
      value: nullable(str("Valor conforme o tipo, ou null.")),
      target: int("Meta de livros (1 a 500)."),
      starts_on: str("Início AAAA-MM-DD."),
      ends_on: str("Fim AAAA-MM-DD."),
    }),
  ),
  tool(
    "propose_loan",
    "Propõe anotar que o usuário emprestou um livro para alguém. O usuário confirma antes.",
    obj({
      book_id: str("Id do livro."),
      person: str("Com quem está (só o nome que o usuário disse)."),
      due_on: nullable(str("Devolver até AAAA-MM-DD, ou null.")),
    }),
  ),
];

export const TOOL_STATUS: Record<string, string> = {
  search_books: "Procurando livros…",
  get_book: "Abrindo o livro…",
  get_my_shelf: "Olhando sua estante…",
  get_reading_now: "Vendo o que você está lendo…",
  get_reading_stats: "Fazendo as contas das suas leituras…",
  get_my_reviews_and_quotes: "Relendo suas resenhas e citações…",
  get_recommendations: "Garimpando recomendações…",
  get_goals_challenges_loans: "Conferindo metas e desafios…",
  show_books: "Separando as capas…",
};

export const ACCOUNT_TOOLS = new Set([
  "get_my_shelf",
  "get_reading_now",
  "get_reading_stats",
  "get_my_reviews_and_quotes",
  "get_recommendations",
  "get_goals_challenges_loans",
  "propose_add_to_list",
]);

export function toolsFor(shareData: boolean) {
  return shareData ? TOOLS : TOOLS.filter((t) => !ACCOUNT_TOOLS.has(t.name));
}
