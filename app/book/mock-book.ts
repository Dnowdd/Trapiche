import { BOOKS } from "../mock";

const BOOK = BOOKS.find((b) => b.id === "capitaes")!;

export const BOOK_DETAIL = {
  ...BOOK,
  subtitle: "Romance",
  edition: "Edição 89 · Companhia das Letras",
  cover_credit: "Capa de Elaine Ramos",
  description: [
    "Publicado em 1937, durante o Estado Novo, Capitães da Areia narra a vida de um grupo de meninos de rua que vive sob a liderança de Pedro Bala num velho trapiche do cais de Salvador. Cada um traz consigo uma história de violência, abandono e amor por essa cidade que ao mesmo tempo os acolhe e os esquece — Sem-Pernas, Pirulito, Volta Seca, Gato, Boa-Vida, Querido-de-Deus, Dora.",
    "Misturando ternura e dureza, lirismo e denúncia social, Jorge Amado constrói uma das obras mais lidas e mais incomodadas da literatura brasileira. Censurado, queimado em praça pública, traduzido em mais de quarenta idiomas — o livro continua perguntando o que o Brasil faz com seus meninos, quase noventa anos depois.",
    "Esta edição traz prefácio de Milton Hatoum, fortuna crítica revista e o trecho original suprimido nas primeiras tiragens.",
  ],
  meta: {
    publisher: "Companhia das Letras",
    year: "1937 · reedição 2009",
    pages: 280,
    language: "Português (Brasil)",
    isbn10: "8535914145",
    isbn13: "9788535914145",
    categories: ["Ficção brasileira", "Romance social", "Modernismo"],
    weight: "320 g",
    dimensions: "16 × 23 × 2 cm",
    format: "Capa comum · Brochura",
    edition_no: "1ª · 2009",
    translator: null,
    original: { lang: "Português", title: "Capitães da Areia" },
  },
  rating: {
    average: 4.7,
    count: 14823,
    distribution: { 5: 9847, 4: 3621, 3: 938, 2: 287, 1: 130 },
    avgDaysToRead: 9,
  },
  // logged user's state — Felipe
  user: {
    status: "lendo", // lendo | quero | lido | abandonei | relendo
    liked: true,
    favorite: true,
    started: "12 mai 2026",
    progress: 71,
    page: 198,
    total: 280,
    expectedDone: "fim de mai",
    streakDays: 9,
    sessions: [
      { date: "24 mai · sex", pages: 18, minutes: 42, page_end: 198 },
      { date: "23 mai · qui", pages: 22, minutes: 51, page_end: 180 },
      { date: "21 mai · ter", pages: 14, minutes: 33, page_end: 158 },
      { date: "20 mai · seg", pages: 26, minutes: 64, page_end: 144 },
      { date: "18 mai · sáb", pages: 31, minutes: 78, page_end: 118 },
    ],
    review: null, // ainda não terminou — sem resenha
    note: "Reli o capítulo do Sem-Pernas duas vezes. Dói mais do que eu lembrava.",
    times_read: 2,
    last_read: "out 2025",
  },
  // outras leitoras
  reviews: [
    {
      user: "Júlia Mendonça",
      handle: "@jumendonca",
      initials: "JM",
      stars: 5,
      date: "há 2 dias",
      days: 7,
      text: "Reli depois de 12 anos. Continua sendo o livro que melhor entende o Brasil — a violência cotidiana, a ternura entre os pobres, o jeito que o Estado nos enxerga como problema antes de nos enxergar como gente. Jorge Amado escreveu em 1937 e parece manchete de hoje.",
      likes: 234,
      comments: 38,
    },
    {
      user: "Marina Coutinho",
      handle: "@maricout",
      initials: "MC",
      stars: 4,
      date: "há 5 dias",
      days: 11,
      text: "Discordo de quem fala que é leitura fácil. É leitura RÁPIDA, que é diferente. O Jorge Amado disfarça muito bem a complexidade política dele numa prosa que escorrega. Tirei meia estrela porque o tratamento da Dora envelheceu mal — mas isso é meu, talvez injusto pra uma obra de 1937.",
      likes: 112,
      comments: 24,
    },
    {
      user: "Carlos Andrade",
      handle: "@candrade.lit",
      initials: "CA",
      stars: 5,
      date: "há 1 semana",
      days: 4,
      text: "Comprei essa edição da Companhia só pelo prefácio do Hatoum e fiquei. O texto está revisto, sem aquelas correções estranhas que outras edições fizeram. Vale demais.",
      likes: 67,
      comments: 9,
    },
    {
      user: "Ana Sertão",
      handle: "@anasertao",
      initials: "AS",
      stars: 5,
      date: "há 2 semanas",
      days: 5,
      text: "Li com meus alunos do segundo ano. Eles entenderam tudo. Quem fala que jovem não lê clássico nunca tentou apresentar o Sem-Pernas pra uma sala de 35.",
      likes: 412,
      comments: 51,
    },
  ],
  // listas onde esse livro aparece
  in_my_lists: [
    { title: "Brasileiras que mudam o ano", kind: "Pública", count: 12 },
    { title: "Releituras essenciais", kind: "Pública", count: 8 },
    { title: "Sertão, nordeste, dor & afeto", kind: "Pública", count: 9 },
  ],
  in_public_lists: [
    {
      title: "O cânone brasileiro que vale a pena",
      kind: "Comunidade",
      count: 32,
      by: "Júlia M.",
      subscribers: 1240,
    },
    {
      title: "100 anos de literatura baiana",
      kind: "Comunidade",
      count: 100,
      by: "Soterópolis Lê",
      subscribers: 4218,
    },
    {
      title: "Leituras de escola, sem trauma",
      kind: "Comunidade",
      count: 24,
      by: "Prof. Carlos A.",
      subscribers: 612,
    },
  ],
  // related
  related: [
    BOOKS.find((b) => b.id === "quarto")!,
    BOOKS.find((b) => b.id === "torto")!,
    BOOKS.find((b) => b.id === "secas")!,
    BOOKS.find((b) => b.id === "cortico")!,
    BOOKS.find((b) => b.id === "macunaima")!,
  ],
  // Jorge Amado bibliografia
  by_author: [
    { title: "Gabriela, Cravo e Canela", year: 1958 },
    { title: "Dona Flor e Seus Dois Maridos", year: 1966 },
    { title: "Jubiabá", year: 1935 },
    { title: "Tieta do Agreste", year: 1977 },
  ],
};
