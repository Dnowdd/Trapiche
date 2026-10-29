import type { GoogleBooksVolume } from "./types/book";

const STOPWORDS = new Set([
  "a",
  "o",
  "as",
  "os",
  "e",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "um",
  "uma",
  "para",
  "por",
  "com",
  "the",
  "of",
  "and",
  "edicao",
  "edition",
  "ed",
  "portuguese",
]);

const NOTABLE_PUBLISHERS = [
  "boitempo",
  "edipro",
  "companhia das letras",
  "penguin",
  "record",
  "rocco",
  "intrinseca",
  "sextante",
  "arqueiro",
  "zahar",
  "todavia",
  "autentica",
  "aleph",
  "darkside",
  "expressao popular",
  "globo",
  "objetiva",
  "alfaguara",
  "suma",
  "seguinte",
  "planeta",
  "l&pm",
  "antofagica",
  "ubu",
  "editora 34",
  "nova fronteira",
  "jose olympio",
  "civilizacao brasileira",
  "paz e terra",
  "martins fontes",
  "martin claret",
  "vozes",
  "unesp",
  "harpercollins",
  "galera",
  "verus",
  "bertrand",
  "principis",
  "nova cultural",
  "biblioteca azul",
  "carambaia",
  "infinito particular",
  "dublinense",
  "relicario",
  "fosforo",
  "elefante",
  "n-1",
  "cosac",
];

const SELF_PUBLISHERS = [
  "clube de autores",
  "independently published",
  "createspace",
  "kdp",
  "edicao do autor",
  "edicao independente",
  "agbook",
  "perse",
];

export function cleanAuthor(name: string) {
  const cleaned = name
    .replace(/\\?u00([0-9a-f]{2})/gi, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/\([^)]*\)/g, "")
    .replace(/,?\s*\d{3,4}\??\s*-\s*(\d{3,4})?\.?\s*$/, "")
    .replace(/,\s*$/, "")
    .trim();
  const parts = cleaned.split(",").map((p) => p.trim());
  const suffix = /^(jr|sr|filho|neto|junior|júnior)\.?$/i;
  return parts.length === 2 && parts[0] && parts[1] && !suffix.test(parts[1])
    ? `${parts[1]} ${parts[0]}`
    : cleaned;
}

export function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^\p{L}\p{N}&]+/gu, " ")
    .trim();
}

function titleTokens(title: string) {
  return normalize(title)
    .split(" ")
    .filter((t) => t && !STOPWORDS.has(t) && !/^\d+a?ed$/.test(t));
}

export function authorSurname(author?: string) {
  if (!author) return "";
  const parts = normalize(cleanAuthor(author)).split(" ").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

export function workKey(title: string, author?: string) {
  const tokens = [...new Set(titleTokens(title))].sort();
  return `${tokens.join(" ")}|${authorSurname(author)}`;
}

function volumeKey(v: GoogleBooksVolume) {
  return workKey(v.volumeInfo.title, v.volumeInfo.authors?.[0]);
}

function publisherMatches(publisher: string | undefined, list: string[]) {
  if (!publisher) return false;
  const p = normalize(publisher);
  return list.some((name) => p.includes(name));
}

export function editionScore(v: GoogleBooksVolume) {
  const info = v.volumeInfo;
  let score = 0;
  score += info.imageLinks ? 4 : -6;
  if (!info.publisher) score -= 2;
  else if (publisherMatches(info.publisher, SELF_PUBLISHERS)) score -= 6;
  else if (publisherMatches(info.publisher, NOTABLE_PUBLISHERS)) score += 5;
  if (info.pageCount) score += 1;
  if (info.description) score += 1;
  if (info.language?.startsWith("pt")) score += 1;
  if (info.ratingsCount)
    score += Math.min(3, Math.log10(info.ratingsCount + 1));
  if (info.workEditions) score += Math.min(6, Math.log2(info.workEditions + 1));
  return score;
}

function queryMatch(v: GoogleBooksVolume, query: string) {
  const q = normalize(query);
  if (!q) return 0;
  const byAuthor = v.volumeInfo.authors?.some((a) =>
    normalize(cleanAuthor(a)).includes(q),
  );
  const title = normalize(v.volumeInfo.title);
  if (title === q) return byAuthor ? 6 : q.includes(" ") ? 4 : 6;
  if (title.startsWith(q)) return 4;
  const tokens = titleTokens(query);
  const own = new Set(titleTokens(v.volumeInfo.title));
  if (tokens.length && tokens.every((t) => own.has(t))) return 2;
  if (byAuthor) return 5;
  const author = normalize(v.volumeInfo.authors?.join(" ") ?? "");
  if (author && q.split(" ").some((t) => t.length > 2 && author.includes(t)))
    return 1;
  return 0;
}

export function sortEditions(volumes: GoogleBooksVolume[]) {
  return [...volumes].sort((a, b) => editionScore(b) - editionScore(a));
}

export function sameWork(v: GoogleBooksVolume, title: string, author?: string) {
  return volumeKey(v) === workKey(title, author);
}

export interface Work {
  main: GoogleBooksVolume;
  editions: GoogleBooksVolume[];
}

export function groupWorks(volumes: GoogleBooksVolume[], query: string) {
  const groups = new Map<
    string,
    { vols: GoogleBooksVolume[]; first: number }
  >();
  const seen = new Set<string>();
  volumes.forEach((v, i) => {
    if (seen.has(v.id)) return;
    seen.add(v.id);
    const key = volumeKey(v);
    const g = groups.get(key);
    if (g) g.vols.push(v);
    else groups.set(key, { vols: [v], first: i });
  });

  const ranked = [...groups.values()]
    .map(({ vols, first }) => {
      const sorted = sortEditions(vols);
      const published = sorted.filter((e) => e.volumeInfo.publisher);
      const editions = published.length ? published : sorted.slice(0, 1);
      const main = editions[0];
      const match = Math.max(...editions.map((e) => queryMatch(e, query)));
      const score =
        editionScore(main) +
        Math.log2(editions.length) * 2 +
        match * 1.5 -
        Math.min(first, 40) * 0.1;
      return { main, editions, match, score };
    })
    .sort((a, b) => b.score - a.score);
  const matching = ranked.filter((w) => w.match > 0);
  return (matching.length ? matching : ranked).map(
    ({ main, editions }): Work => ({ main, editions }),
  );
}
