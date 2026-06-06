import { BOOKS } from "@/app/mock";

const byId = (id: string) => BOOKS.find((b) => b.id === id)!;

export const USER = {
  name: "Felipe Carvalho",
  handle: "@flpcrvlh",
  initials: "FC",
  city: "Salvador · BA",
  joined: "Março/2024",
  bio: "Engenheiro de software de dia, leitor compulsivo o resto do tempo. Tenho fraqueza por modernistas brasileiros, ficção do nordeste e qualquer coisa que o Jorge Amado tenha escrito. Atualmente lendo o que sobra da pilha de 2025.",
  stats: [
    { value: 8, label: "concluídos" },
    { value: 3, label: "lendo" },
    { value: 278, label: "quero ler" },
    { value: 2, label: "relendo" },
    { value: 47, label: "abandonei" },
    { value: 12, label: "resenhas" },
  ],
};

export const FAVORITES = [
  byId("capitaes"),
  byId("torto"),
  byId("hora"),
  byId("sertao"),
  byId("quarto"),
];

export const READING_NOW = [
  {
    book: byId("sertoes"),
    progress: 64,
    page: 461,
    total: 720,
    started: "12 abr",
    expected: "fim de mai",
  },
  {
    book: byId("macunaima"),
    progress: 22,
    page: 42,
    total: 192,
    started: "20 mai",
    expected: "início de jun",
  },
  {
    book: byId("poncia"),
    progress: 89,
    page: 128,
    total: 144,
    started: "18 mai",
    expected: "amanhã",
  },
];

export const ACTIVITY = [
  {
    kind: "review",
    book: byId("torto"),
    stars: 5,
    when: "há 2 dias",
    text: "Um livro que me atravessou. Itamar escreve com a paciência de quem entende que o tempo do sertão é outro.",
  },
  {
    kind: "finished",
    book: byId("hora"),
    when: "há 4 dias",
    days: 3,
  },
  {
    kind: "started",
    book: byId("macunaima"),
    when: "há 4 dias",
  },
  {
    kind: "added",
    book: byId("iracema"),
    list: "Quero ler",
    when: "há 5 dias",
  },
  {
    kind: "list",
    listName: "Brasileiras que mudam o ano",
    count: 12,
    when: "há 1 semana",
  },
  {
    kind: "finished",
    book: byId("quinze"),
    when: "há 1 semana",
    days: 5,
  },
  {
    kind: "review",
    book: byId("quinze"),
    stars: 4,
    when: "há 1 semana",
    text: "Rachel de Queiroz com 19 anos escrevendo isso. Um soco.",
  },
];

/* ============================================================
   Reviews — full reviews for the Avaliações tab
============================================================ */
export const MY_REVIEWS = [
  {
    book: byId("torto"),
    stars: 5,
    date: "12 mai 2026",
    days: 11,
    text: "Um livro que me atravessou. Itamar escreve com a paciência de quem entende que o tempo do sertão é outro — não dá pra atravessar correndo, mas também não dá pra fugir. Bibiana e Belonísia ficaram comigo dias depois de fechar o livro, e tem trechos que eu li três, quatro vezes em voz alta só pelo som. É raro um romance brasileiro contemporâneo que consegue ser político sem panfleto, lírico sem decoração. Esse consegue.",
    likes: 18,
    comments: 4,
  },
  {
    book: byId("hora"),
    stars: 5,
    date: "06 mai 2026",
    days: 3,
    text: "Clarice no estado mais puro. Macabéa é uma personagem que dói. A narração que se interrompe a cada parágrafo pra duvidar de si mesma é exatamente o tipo de coisa que muita gente acha 'difícil' — mas se você ler com calma, é o oposto: é Clarice te pegando pela mão e dizendo 'olha, eu também não sei direito o que estou fazendo.' Final que me deixou em silêncio por uma hora.",
    likes: 24,
    comments: 7,
  },
  {
    book: byId("quinze"),
    stars: 4,
    date: "02 mai 2026",
    days: 5,
    text: "Rachel de Queiroz escreveu isso com 19 anos e ganhou o Graça Aranha. Pensa nisso. A seca de 1915 narrada com economia de palavras que faz vergonha em muito romance contemporâneo. Tirei meia estrela só porque alguns trechos do final me pareceram apressados — mas é injusto. Voltarei a esse livro.",
    likes: 11,
    comments: 2,
  },
  {
    book: byId("casmurro"),
    stars: 5,
    date: "18 abr 2026",
    days: 14,
    text: "Releitura. Cada vez que eu volto a esse livro eu acho um Bentinho diferente. Aos 17 ele era o coitado. Aos 25 ele era o ciumento. Agora aos 32 ele é só um homem que não sabe se virar sem culpar uma mulher pelo que ele mesmo construiu. Machado já sabia de tudo.",
    likes: 31,
    comments: 12,
  },
  {
    book: byId("quarto"),
    stars: 5,
    date: "10 abr 2026",
    days: 7,
    text: "Não é exagero dizer que esse livro é leitura obrigatória pra qualquer pessoa que viva no Brasil. Carolina Maria de Jesus escrevendo da favela do Canindé em 1955 e sendo mais lúcida sobre desigualdade que 95% do que se escreve hoje. Tem páginas que eu precisei parar e respirar.",
    likes: 42,
    comments: 9,
  },
];

/* ============================================================
   Diário — calendar heatmap data + entries
   Generate 1 year of plausible reading data, deterministically
============================================================ */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateHeatmap(year: number, seed: number) {
  const rand = mulberry32(seed);
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const days = [];
  // align to Sunday-start week
  const firstDow = start.getDay();
  for (let i = 0; i < firstDow; i++) days.push(null);

  const today = new Date(2026, 4, 24); // 24 mai 2026

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    if (date > today) {
      days.push({ date, minutes: 0, future: true });
      continue;
    }
    // ~62% of days have reading
    const r = rand();
    let minutes = 0;
    if (r > 0.38) {
      // 12 - 180 min, biased low
      const t = rand();
      minutes = Math.floor(12 + Math.pow(t, 1.6) * 168);
    }
    // weekend boost
    const dow = date.getDay();
    if ((dow === 0 || dow === 6) && minutes > 0)
      minutes = Math.min(220, Math.floor(minutes * 1.4));
    days.push({ date, minutes });
  }
  return days;
}

export const HEATMAPS = {
  2026: generateHeatmap(2026, 42),
  2025: generateHeatmap(2025, 13),
  2024: generateHeatmap(2024, 91),
};

export const DIARY_ENTRIES = [
  {
    date: "24 mai · sex",
    book: byId("sertoes"),
    pages: 32,
    minutes: 78,
    note: "Capítulo IV. Euclides desenhando a paisagem como se fosse mapa militar.",
  },
  {
    date: "23 mai · qui",
    book: byId("poncia"),
    pages: 22,
    minutes: 52,
    note: "Antes de dormir. Conceição escreve em silêncio.",
  },
  {
    date: "23 mai · qui",
    book: byId("sertoes"),
    pages: 18,
    minutes: 44,
    note: null,
  },
  {
    date: "22 mai · qua",
    book: byId("macunaima"),
    pages: 14,
    minutes: 31,
    note: "Começando. Mário vai me cansar mas eu quero terminar esse ano.",
  },
  {
    date: "21 mai · ter",
    book: byId("sertoes"),
    pages: 41,
    minutes: 95,
    note: "Sessão longa, fim de tarde no Pelourinho.",
  },
  {
    date: "20 mai · seg",
    book: byId("poncia"),
    pages: 38,
    minutes: 84,
    note: "Releitura. Continua devastador.",
  },
  {
    date: "18 mai · sáb",
    book: byId("sertoes"),
    pages: 52,
    minutes: 121,
    note: "Manhã inteira. Café e Euclides, nada mais.",
  },
];

/* ============================================================
   Listas — 8 listas do usuário
============================================================ */
export const LISTS_FULL = [
  {
    id: "brasileiras-2026",
    title: "Brasileiras que mudam o ano",
    count: 12,
    kind: "Pública",
    byInitials: "FC",
    by: "Você",
    updated: "Há 3 dias",
    pinned: true,
    books: [BOOKS[14], BOOKS[2], BOOKS[15], BOOKS[11]],
    note: "Minha lista do ano. Conceção, Clarice, Carolina, Itamar.",
  },
  {
    id: "modernismo",
    title: "Modernismo de cabeça",
    count: 8,
    kind: "Compartilhada",
    byInitials: "JM",
    by: "Júlia M.",
    updated: "Há 1 semana",
    pinned: true,
    books: [BOOKS[7], BOOKS[4], BOOKS[10]],
    note: "Curadoria da Júlia, eu só contribuo de vez em quando.",
  },
  {
    id: "inverno",
    title: "Para ler no inverno",
    count: 6,
    kind: "Privada",
    byInitials: "FC",
    by: "Você",
    updated: "Há 2 semanas",
    pinned: false,
    books: [BOOKS[3], BOOKS[6], BOOKS[13]],
    note: "Coisa densa pra ler embaixo do cobertor.",
  },
  {
    id: "machadiana",
    title: "Releituras machadianas",
    count: 5,
    kind: "Pública",
    byInitials: "FC",
    by: "Você",
    updated: "Há 1 mês",
    pinned: false,
    books: [BOOKS[1], BOOKS[5], BOOKS[13]],
    note: "Machado revisitado por década.",
  },
  {
    id: "capa-bonita",
    title: "Capa que vale o livro inteiro",
    count: 22,
    kind: "Pública",
    byInitials: "FC",
    by: "Você",
    updated: "Há 1 mês",
    pinned: false,
    books: [BOOKS[8], BOOKS[9], BOOKS[12]],
    note: "Curadoria visual. Capa primeiro, texto depois.",
  },
  {
    id: "clube-mai",
    title: "Clube do livro · Maio/2026",
    count: 3,
    kind: "Compartilhada",
    byInitials: "AS",
    by: "Ana S. e + 14",
    updated: "Há 3 dias",
    pinned: false,
    books: [BOOKS[15], BOOKS[11]],
    note: "Pequeno grupo do bairro, reuniões nas sextas.",
  },
  {
    id: "viagem",
    title: "Pra levar na viagem",
    count: 4,
    kind: "Privada",
    byInitials: "FC",
    by: "Você",
    updated: "Há 2 meses",
    pinned: false,
    books: [BOOKS[6], BOOKS[14]],
    note: "Só livro fino. Mochila pequena.",
  },
  {
    id: "sertao-nordeste",
    title: "Sertão, nordeste, dor & afeto",
    count: 9,
    kind: "Pública",
    byInitials: "FC",
    by: "Você",
    updated: "Há 3 meses",
    pinned: false,
    books: [BOOKS[3], BOOKS[6], BOOKS[15], BOOKS[0]],
    note: "Vidas Secas, O Quinze, Torto Arado e o resto.",
  },
];

/* ============================================================
   Curtidas — 34 livros marcados com ♡
============================================================ */
export const LIKES = [
  { book: BOOKS[0], when: "Há 3 dias", year: 2026 },
  { book: BOOKS[15], when: "Há 4 dias", year: 2026 },
  { book: BOOKS[2], when: "Há 1 semana", year: 2026 },
  { book: BOOKS[11], when: "Há 2 semanas", year: 2026 },
  { book: BOOKS[8], when: "Há 3 semanas", year: 2026 },
  { book: BOOKS[14], when: "Há 1 mês", year: 2026 },
  { book: BOOKS[6], when: "Há 1 mês", year: 2026 },
  { book: BOOKS[5], when: "Há 2 meses", year: 2026 },
  { book: BOOKS[1], when: "Há 2 meses", year: 2026 },
  { book: BOOKS[12], when: "Há 3 meses", year: 2026 },
  { book: BOOKS[4], when: "Há 3 meses", year: 2026 },
  { book: BOOKS[3], when: "Há 4 meses", year: 2026 },
  { book: BOOKS[7], when: "Dez 2025", year: 2025 },
  { book: BOOKS[10], when: "Nov 2025", year: 2025 },
  { book: BOOKS[13], when: "Out 2025", year: 2025 },
  { book: BOOKS[9], when: "Set 2025", year: 2025 },
  { book: BOOKS[0], when: "Jul 2025", year: 2025 },
  { book: BOOKS[2], when: "Jun 2025", year: 2025 },
];

/* ============================================================
   Abandonos — sem culpa
============================================================ */
export const ABANDONOS = [
  {
    book: BOOKS[4],
    percent: 18,
    page: 112,
    total: 624,
    abandonedAt: "22 abr 2026",
    spentDays: 31,
    reason:
      "Só não consegui engatar. Guimarães Rosa pede um tempo que eu não tinha. Volto.",
    again: true,
  },
  {
    book: BOOKS[8],
    percent: 42,
    page: 77,
    total: 184,
    abandonedAt: "08 mar 2026",
    spentDays: 12,
    reason:
      "Estava num momento pesado. Clarice não ajuda quando você já está cansada.",
    again: true,
  },
  {
    book: BOOKS[12],
    percent: 9,
    page: 64,
    total: 720,
    abandonedAt: "15 fev 2026",
    spentDays: 8,
    reason: null,
    again: false,
  },
  {
    book: BOOKS[10],
    percent: 56,
    page: 242,
    total: 432,
    abandonedAt: "19 jan 2026",
    spentDays: 27,
    reason: "Acabou se virando uma obrigação. Quando vira obrigação, eu paro.",
    again: true,
  },
  {
    book: BOOKS[9],
    percent: 33,
    page: 47,
    total: 144,
    abandonedAt: "02 dez 2025",
    spentDays: 5,
    reason: "Estilo não me pegou.",
    again: false,
  },
];

/* ============================================================
   Releituras — livros que voltam
============================================================ */
export const RELEITURAS = [
  {
    book: BOOKS[5],
    times: 4,
    dates: ["2018 · 1ª", "2020 · 2ª", "2023 · 3ª", "2026 · 4ª"],
    last: "abr/2026",
    note: "O livro que mais me acompanhou.",
  },
  {
    book: BOOKS[0],
    times: 3,
    dates: ["2019 · 1ª", "2022 · 2ª", "2025 · 3ª"],
    last: "out/2025",
    note: "De onde veio o nome do Trapiche, né.",
  },
  {
    book: BOOKS[2],
    times: 3,
    dates: ["2021 · 1ª", "2024 · 2ª", "2026 · 3ª"],
    last: "mai/2026",
    note: "A cada leitura, mais curto e mais doloroso.",
  },
  {
    book: BOOKS[14],
    times: 2,
    dates: ["2024 · 1ª", "2026 · 2ª"],
    last: "mar/2026",
    note: "Volto sempre pra Conceção.",
  },
  {
    book: BOOKS[15],
    times: 2,
    dates: ["2023 · 1ª", "2026 · 2ª"],
    last: "jan/2026",
    note: "Releitura por causa da adaptação anunciada.",
  },
  {
    book: BOOKS[11],
    times: 2,
    dates: ["2022 · 1ª", "2025 · 2ª"],
    last: "jul/2025",
    note: null,
  },
];

export const STATS = {
  thisYear: {
    year: 2026,
    books: 8,
    pages: 2140,
    hours: 67,
    avgPerDay: 12,
    avgPerBook: 8,
  },
  lastYear: { year: 2025, books: 22, pages: 6890, hours: 184, avgPerDay: 30 },
  streak: 14, // dias consecutivos
  longestStreak: 41,
  fastestBook: { book: byId("hora"), days: 3 },
  slowestBook: { book: byId("sertao"), days: 47 },
  busiest: { day: "sábado", avg: 38 },
};
