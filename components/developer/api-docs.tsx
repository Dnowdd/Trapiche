import { appUrl } from "@/lib/emails/layout";
import {
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  RATE_PER_DAY,
  RATE_PER_MINUTE,
} from "@/lib/api/limits";
import CopyButton from "./copy-button";

const PAGINATION = [
  ["page", `Página, começando em 1. Padrão 1.`],
  [
    "per_page",
    `Itens por página, de 1 a ${MAX_PER_PAGE}. Padrão ${DEFAULT_PER_PAGE}.`,
  ],
] as const;

const ENDPOINTS: {
  path: string;
  title: string;
  description: string;
  params: (readonly [string, string])[];
  paginated: boolean;
}[] = [
  {
    path: "/me",
    title: "Sua conta",
    description: "Nome, @, bio e quantos livros você tem em cada status.",
    params: [],
    paginated: false,
  },
  {
    path: "/shelf",
    title: "Estante",
    description: "Os livros da sua estante com status, curtida e favorito.",
    params: [
      [
        "status",
        "WANT, READING, READ, ABANDONED, REREADING. Aceita vários: status=READ,READING.",
      ],
      ["q", "Busca no título (ou autor exato)."],
      ["liked", "true ou false."],
      ["favorite", "true ou false."],
      ["sort", "updated (padrão), added ou title."],
    ],
    paginated: true,
  },
  {
    path: "/readings",
    title: "Leituras",
    description:
      "Cada leitura (inclusive releituras) com início e fim. Datas podem ser só o ano (2024) ou o mês (2024-05).",
    params: [
      ["status", "ACTIVE, FINISHED ou ABANDONED. Aceita vários."],
      ["year", "Leituras terminadas nesse ano. Ex.: 2026."],
    ],
    paginated: true,
  },
  {
    path: "/lists",
    title: "Suas listas",
    description: "As listas que você criou ou das quais participa.",
    params: [["visibility", "PUBLIC, PRIVATE ou SHARED. Aceita vários."]],
    paginated: true,
  },
  {
    path: "/lists/{id}",
    title: "Uma lista",
    description:
      "Detalhes de uma lista pública ou de uma lista da qual você participa.",
    params: [],
    paginated: false,
  },
  {
    path: "/lists/{id}/items",
    title: "Livros de uma lista",
    description: "Os livros de uma lista que você pode ver.",
    params: [],
    paginated: true,
  },
];

const EXAMPLE = `{
  "data": [
    {
      "status": "READ",
      "statusChangedAt": "2026-10-20T14:02:11.000Z",
      "addedAt": "2026-09-01T10:00:00.000Z",
      "liked": true,
      "favoritePosition": 1,
      "currentPage": 176,
      "book": {
        "id": "OL7353617M",
        "source": "open_library",
        "title": "Vidas Secas",
        "authors": ["Graciliano Ramos"],
        "isbn13": "9788501021051",
        "pageCount": 176,
        "url": "${appUrl("/book/OL7353617M")}"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "totalPages": 3,
    "totalItems": 47
  }
}`;

function Code({ children, copy }: { children: string; copy?: boolean }) {
  return (
    <div className="relative">
      <pre className="m-0 overflow-x-auto rounded-xl bg-(--ink-2) text-(--cream) p-4 text-[12.5px] leading-[1.55] font-mono">
        {children}
      </pre>
      {copy && (
        <CopyButton
          value={children}
          className="absolute top-2.5 right-2.5 bg-(--cream) border-transparent"
        />
      )}
    </div>
  );
}

const h2 = "m-0 mt-10 mb-3 text-[18px] font-bold text-(--ink)";
const p = "m-0 mb-3 text-[14px] text-(--ink-3) leading-[1.6]";
const inline =
  "font-mono text-[12.5px] bg-[rgba(67,62,18,0.07)] text-(--ink-2) px-1.5 py-0.5 rounded";

export default function ApiDocs() {
  const base = appUrl("/api/v1");
  return (
    <section>
      <h2 className={h2}>Como usar</h2>
      <p className={p}>
        Todas as rotas são <code className={inline}>GET</code> e ficam em{" "}
        <code className={inline}>{base}</code>. Mande a chave no cabeçalho{" "}
        <code className={inline}>Authorization</code>:
      </p>
      <Code copy>{`curl "${base}/shelf?status=READ&per_page=10" \\
  -H "Authorization: Bearer trp_live_SUA_CHAVE"`}</Code>

      <h2 className={h2}>Paginação</h2>
      <p className={p}>
        Rotas que devolvem listas aceitam{" "}
        {PAGINATION.map(([name], i) => (
          <span key={name}>
            <code className={inline}>{name}</code>
            {i === 0 ? " e " : ""}
          </span>
        ))}{" "}
        e sempre respondem com <code className={inline}>pagination</code>: a
        página atual, itens por página, total de páginas e total de registros.
      </p>
      <Code>{EXAMPLE}</Code>

      <h2 className={h2}>Endpoints</h2>
      <div className="flex flex-col gap-3">
        {ENDPOINTS.map((e) => (
          <div
            key={e.path}
            className="rounded-[14px] border border-[rgba(67,62,18,0.1)] bg-(--cream-card) p-4 sm:p-5"
          >
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-[10.5px] font-bold bg-(--ink-2) text-(--yellow) px-2 py-0.5 rounded">
                GET
              </span>
              <code className="font-mono text-[13.5px] font-semibold text-(--ink)">
                /api/v1{e.path}
              </code>
              <span className="text-[13px] text-(--ink-4)">· {e.title}</span>
            </div>
            <p className="m-0 mt-2 text-[13px] text-(--ink-3)">
              {e.description}
            </p>
            {(e.params.length > 0 || e.paginated) && (
              <dl className="m-0 mt-3 grid gap-1.5 text-[12.5px]">
                {[...e.params, ...(e.paginated ? PAGINATION : [])].map(
                  ([name, desc]) => (
                    <div key={name} className="flex gap-3">
                      <dt className="font-mono text-(--ink-2) w-22 shrink-0">
                        {name}
                      </dt>
                      <dd className="m-0 text-(--ink-3)">{desc}</dd>
                    </div>
                  ),
                )}
              </dl>
            )}
          </div>
        ))}
      </div>

      <h2 className={h2}>Limites</h2>
      <p className={p}>
        Cada chave pode fazer {RATE_PER_MINUTE} requisições por minuto e{" "}
        {RATE_PER_DAY.toLocaleString("pt-BR")} por dia. As respostas trazem{" "}
        <code className={inline}>X-RateLimit-Limit</code>,{" "}
        <code className={inline}>X-RateLimit-Remaining</code> e{" "}
        <code className={inline}>X-RateLimit-Reset</code>. Passou do limite, a
        resposta é <code className={inline}>429</code> com{" "}
        <code className={inline}>Retry-After</code>.
      </p>

      <h2 className={h2}>Erros</h2>
      <p className={p}>Erros vêm sempre neste formato:</p>
      <Code>{`{ "error": { "code": "invalid_parameter", "message": "per_page: use de 1 a ${MAX_PER_PAGE}." } }`}</Code>
      <dl className="m-0 mt-3 grid gap-1.5 text-[12.5px]">
        {[
          ["400", "invalid_parameter"],
          ["401", "missing_api_key, invalid_api_key"],
          ["404", "not_found"],
          ["429", "rate_limited"],
        ].map(([status, codes]) => (
          <div key={status} className="flex gap-3">
            <dt className="font-mono text-(--ink-2) w-12 shrink-0">{status}</dt>
            <dd className="m-0 font-mono text-(--ink-3)">{codes}</dd>
          </div>
        ))}
      </dl>

      <h2 className={h2}>Dados dos livros</h2>
      <p className={p}>
        Cada livro diz de onde veio em <code className={inline}>source</code>.
        Livros da Open Library trazem editora, data e capa. Livros que vieram do
        Google Books trazem só título, autores, ISBN e páginas, por precaução
        com os termos de uso do Google. Ao exibir, cite a fonte e o Trapiche.
      </p>
    </section>
  );
}
