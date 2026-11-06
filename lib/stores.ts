export interface StoreLink {
  id: "amazon" | "estante-virtual" | "google-play";
  name: string;
  hint: string;
  url: string;
  sponsored: boolean;
}

export function storeLinks(
  book: {
    title: string;
    authors: string[];
    isbn13: string | null;
    isbn10: string | null;
  },
  amazonTag = process.env.AMAZON_ASSOCIATE_TAG,
): StoreLink[] {
  const isbn = book.isbn13 ?? book.isbn10;
  const byTitle = [book.title, book.authors[0]].filter(Boolean).join(" ");
  const amazon = new URL("https://www.amazon.com.br/s");
  amazon.searchParams.set("k", isbn ?? byTitle);
  amazon.searchParams.set("i", "stripbooks");
  if (amazonTag) amazon.searchParams.set("tag", amazonTag);
  const estante = new URL("https://www.estantevirtual.com.br/busca");
  estante.searchParams.set("q", byTitle);
  const play = new URL("https://play.google.com/store/search");
  play.searchParams.set("q", isbn ?? byTitle);
  play.searchParams.set("c", "books");
  return [
    {
      id: "amazon",
      name: "Amazon",
      hint: "Novo, e-book e Kindle",
      url: amazon.toString(),
      sponsored: Boolean(amazonTag),
    },
    {
      id: "estante-virtual",
      name: "Estante Virtual",
      hint: "Usados em sebos",
      url: estante.toString(),
      sponsored: false,
    },
    {
      id: "google-play",
      name: "Google Play Livros",
      hint: "E-book e audiolivro",
      url: play.toString(),
      sponsored: false,
    },
  ];
}
