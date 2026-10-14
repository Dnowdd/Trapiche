#!/usr/bin/env node
/**
 * Gera lib/data/books.json a partir de scripts/data/book-list.mjs.
 *
 * Cada item da lista pode ser:
 *   "8lhmAwAAQBAJ"                    → id de volume do Google Books (edição fixada)
 *   "Dom Casmurro - Machado de Assis" → busca por título e autor (o script escolhe)
 *   "https://books.google.com/books?id=8lhmAwAAQBAJ"  → URL também vale
 *   "id:8lhmAwAAQBAJ"                 → forma explícita, se der ambiguidade
 *
 * Id fixado gasta 1 requisição e vem exatamente a edição pedida. Busca por
 * título gasta até 4 e quem escolhe a edição é a pontuação - que olha título,
 * autor, idioma e capa, mas *não* sabe qual edição é a mais conhecida. Quando a
 * capa vier estranha, pegue o id da edição certa com --candidates e fixe.
 *
 * Uso:
 *   npm run books                                  # incremental
 *   node scripts/build-books.mjs --candidates="Vidas Secas Graciliano Ramos"
 *   node scripts/build-books.mjs --force           # refaz tudo do zero
 *   node scripts/build-books.mjs --retry-missing   # tenta de novo o que faltou
 *   node scripts/build-books.mjs --refetch-no-cover# rebusca os que ficaram sem capa
 *   node scripts/build-books.mjs --only=clarice,rosa --force   # rebusca só esses
 *   node scripts/build-books.mjs --limit=10        # teste rápido
 *   node scripts/build-books.mjs --delay=2000      # ms entre requisições
 *
 * Os filtros escolhem o que vai à rede, não o que vai pro arquivo: a saída é
 * sempre o catálogo inteiro (cache + o que acabou de ser buscado).
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIST_PATH = path.join(ROOT, "scripts/data/book-list.mjs");
const OUT_PATH = path.join(ROOT, "lib/data/books.json");
const REPORT_PATH = path.join(ROOT, "scripts/data/build-report.json");
const CACHE_PATH = path.join(ROOT, "scripts/data/.cache/google-volumes.json");

const API_BASE = "https://www.googleapis.com/books/v1";

// ---------- CLI ----------

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const CONFIG = {
  delay: Number(opt("delay", 1200)), // pausa entre requisições (ms)
  maxRetries: Number(opt("retries", 5)), // tentativas em caso de 429/5xx
  limit: Number(opt("limit", 0)), // teto de livros buscados na rede
  only: opt("only", "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  candidates: opt("candidates", ""),
  force: flag("force"),
  retryMissing: flag("retry-missing"),
  refetchNoCover: flag("refetch-no-cover"),
  listPath: opt("list", LIST_PATH),
  outPath: opt("out", OUT_PATH),
};

// ---------- .env ----------

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

// ---------- utils ----------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const COMBINING = new RegExp("[\\u0300-\\u036f]", "g");
const stripAccents = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(COMBINING, "");
const norm = (s) =>
  stripAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const normTitle = (s) => norm(s).replace(/^(o|a|os|as|um|uma|uns|umas)\s+/, "");

function slugify(s) {
  return stripAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const hasCover = (vol) => Boolean(vol?.volumeInfo?.imageLinks?.thumbnail);

// mesmo esquema visual usado em app/catalog.ts
const PALETTES = [
  { bg: "#2A2920", fg: "#FFF8D5", pub: "Companhia das Letras" },
  { bg: "#5B3A1E", fg: "#F8E99D", pub: "Record" },
  { bg: "#1E3A3A", fg: "#FFE767", pub: "Cosac Naify" },
  { bg: "#7A2F1F", fg: "#FFE767", pub: "Editora 34" },
  { bg: "#0F2A4A", fg: "#FFF8D5", pub: "Penguin Brasil" },
  { bg: "#FFE767", fg: "#343600", pub: "Trapiche Indie" },
  { bg: "#F8E99D", fg: "#433E12", pub: "Iluminuras" },
  { bg: "#2E2A1E", fg: "#FFE767", pub: "Nova Fronteira" },
  { bg: "#4F4030", fg: "#FFF8D5", pub: "Objetiva" },
  { bg: "#8A4B22", fg: "#FFF8D5", pub: "Alfaguara" },
  { bg: "#1F4030", fg: "#F8E99D", pub: "Boitempo" },
  { bg: "#3A1F40", fg: "#FFE767", pub: "Mundaréu" },
  { bg: "#FFF8D5", fg: "#433E12", pub: "Editora 34" },
  { bg: "#552020", fg: "#FFE767", pub: "Quadrante" },
];

const GLYPHS = ["♁", "✶", "★", "≈", "✦", "○", "▲", "◇", "✿", "▼", "◐", "❀"];

function hashIndex(str, len) {
  let h = 0;
  for (const c of str) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h) % len;
}

// ---------- HTTP ----------

let requestCount = 0;

function backoff(attempt) {
  return (
    Math.min(60_000, CONFIG.delay * 2 ** (attempt + 1)) +
    Math.floor(Math.random() * 500)
  );
}

async function apiGet(url, label) {
  for (let attempt = 0; attempt <= CONFIG.maxRetries; attempt++) {
    if (requestCount > 0) await sleep(CONFIG.delay); // sleep de segurança
    requestCount++;

    let res;
    try {
      res = await fetch(url, { headers: { Accept: "application/json" } });
    } catch (err) {
      const wait = backoff(attempt);
      console.warn(`\n  ! rede falhou (${err.message}) - retry em ${wait}ms`);
      await sleep(wait);
      continue;
    }

    if (res.ok) return res.json();

    // 429 = rate limit, 403 costuma ser quota, 5xx = instabilidade
    if (res.status === 429 || res.status === 403 || res.status >= 500) {
      const wait = backoff(attempt);
      console.warn(
        `\n  ! ${res.status} em "${label}" - esperando ${wait}ms (tentativa ${attempt + 1}/${CONFIG.maxRetries})`,
      );
      await sleep(wait);
      continue;
    }

    throw new Error(`Google Books ${res.status} ${res.statusText} - ${label}`);
  }
  throw new Error(`Esgotou as tentativas - ${label}`);
}

async function searchVolumes(query, maxResults = 10, lang) {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (!key) throw new Error("GOOGLE_BOOKS_API_KEY não encontrada (.env)");
  const url =
    `${API_BASE}/volumes?q=${encodeURIComponent(query)}` +
    `&maxResults=${maxResults}&printType=books&orderBy=relevance` +
    (lang ? `&langRestrict=${lang}` : "") +
    `&key=${key}`;
  const data = await apiGet(url, lang ? `${query} [${lang}]` : query);
  return data.items ?? [];
}

async function getVolumeById(id) {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (!key) throw new Error("GOOGLE_BOOKS_API_KEY não encontrada (.env)");
  const url = `${API_BASE}/volumes/${encodeURIComponent(id)}?key=${key}`;
  return apiGet(url, `id:${id}`);
}

// ---------- escolha do melhor volume (só para entradas por título) ----------

const JUNK =
  /\b(resumo|resumos|guia de leitura|guia de estudo|analise|summary|study guide|sparknotes|em quadrinhos|adaptacao|obras completas|box|caderno de|manual do|questoes)\b/;

/** Quanto o título do volume parece com o que foi pedido. null = não tem nada a ver. */
function titleScore(volTitle, wantTitle) {
  const t = normTitle(volTitle);
  if (!t) return null;
  if (t === wantTitle) return 60;
  if (t.startsWith(wantTitle) || wantTitle.startsWith(t)) return 38;
  if (t.includes(wantTitle)) return 24;
  if (wantTitle.includes(t) && t.length > 6) return 12;
  return null; // título sem relação - não serve, mesmo que o autor bata
}

function scoreVolume(vol, want) {
  const info = vol.volumeInfo ?? {};
  const wantTitle = normTitle(want.title);

  const fromTitle = titleScore(info.title ?? "", wantTitle);
  if (fromTitle === null) return -999;
  let score = fromTitle;

  const authors = (info.authors ?? []).map(norm);
  const wantAuthor = norm(want.author);
  const surname = wantAuthor.split(" ").at(-1) ?? "";
  if (authors.some((a) => a === wantAuthor)) score += 45;
  else if (surname.length > 3 && authors.some((a) => a.includes(surname)))
    score += 28;
  else if (authors.length === 0) score -= 5;
  else score -= 30;

  if (info.language?.startsWith("pt")) score += 22;
  else if (info.language) score -= 12;

  if (hasCover(vol)) score += 22;
  if (info.pageCount > 0) score += 8;
  if (info.description) score += 10;
  if (info.publisher) score += 4;
  if (info.averageRating) score += 4;
  if (info.ratingsCount) score += Math.min(info.ratingsCount, 8);

  const haystack = norm([info.title, info.subtitle].filter(Boolean).join(" "));
  if (JUNK.test(haystack) && !JUNK.test(wantTitle)) score -= 45;

  return score;
}

const ACCEPT_SCORE = 40; // abaixo disso, considera não encontrado
const GOOD_SCORE = 95; // acima disso (e com capa), para de tentar outras queries

function queriesFor(want) {
  const t = want.title.replace(/"/g, "");
  const a = want.author.replace(/"/g, "");
  return [
    `intitle:"${t}" inauthor:"${a}"`,
    `intitle:${t} inauthor:${a}`,
    `"${t}" "${a}"`,
  ];
}

async function findVolume(want) {
  let best = null;

  const consider = async (query, lang) => {
    let items = [];
    try {
      items = await searchVolumes(query, 10, lang);
    } catch (err) {
      console.warn(`\n  ! query falhou: ${err.message}`);
      return;
    }
    for (const vol of items) {
      const score = scoreVolume(vol, want);
      if (score > -999 && (!best || score > best.score))
        best = { vol, score, query };
    }
  };

  for (const query of queriesFor(want)) {
    await consider(query);
    // só para cedo se o resultado é bom E tem capa - senão vale tentar outra query
    if (best && best.score >= GOOD_SCORE && hasCover(best.vol)) break;
  }

  // achou uma edição estrangeira? tenta uma vez restrito ao português
  if (best && !best.vol.volumeInfo?.language?.startsWith("pt")) {
    await consider(queriesFor(want)[0], "pt");
  }

  return best && best.score >= ACCEPT_SCORE ? best : null;
}

// ---------- mapeamento para o formato do app ----------

function pickCover(info) {
  const links = info.imageLinks;
  if (!links) return {};
  const raw =
    links.extraLarge ??
    links.large ??
    links.medium ??
    links.small ??
    links.thumbnail ??
    links.smallThumbnail;
  if (!raw) return {};
  const https = (u) =>
    u.replace("http://", "https://").replace("&edge=curl", "");
  return {
    coverUrl: https(raw).replace("&zoom=1", "&zoom=3"),
    thumbnailUrl: https(links.thumbnail ?? links.smallThumbnail ?? raw),
  };
}

function toBook(entry, hit) {
  const info = hit.vol.volumeInfo ?? {};
  const ids = info.industryIdentifiers ?? [];
  const isbn13 = ids.find((x) => x.type === "ISBN_13")?.identifier;
  const isbn10 = ids.find((x) => x.type === "ISBN_10")?.identifier;
  const palette = PALETTES[hashIndex(hit.vol.id, PALETTES.length)];
  const { coverUrl, thumbnailUrl } = pickCover(info);

  const title = info.title ?? entry.title ?? "";
  const author = info.authors?.[0] ?? entry.author ?? "Autor desconhecido";

  return {
    // `id` é o id do volume no Google - é ele que vai em /book/[id]
    id: hit.vol.id,
    googleId: hit.vol.id,
    slug: slugify(`${entry.title ?? title}-${entry.author ?? author}`),
    title,
    subtitle: info.subtitle,
    author,
    authors: info.authors ?? [author],
    // o que a lista pediu, para conferência
    requested: { title: entry.title ?? title, author: entry.author ?? author },
    // edição fixada por id na lista (não passou pela pontuação)
    pinned: entry.kind === "id",
    publisher: info.publisher,
    publishedDate: info.publishedDate,
    year: info.publishedDate
      ? Number(info.publishedDate.slice(0, 4)) || undefined
      : undefined,
    pages: info.pageCount ?? 0,
    categories: info.categories ?? [],
    language: info.language,
    isbn: isbn13 ?? isbn10,
    isbn13,
    isbn10,
    description: info.description,
    coverUrl,
    thumbnailUrl,
    rating:
      info.averageRating != null
        ? { average: info.averageRating, count: info.ratingsCount ?? 0 }
        : undefined,
    glyph: GLYPHS[hashIndex(hit.vol.id, GLYPHS.length)],
    palette: { ...palette, pub: info.publisher?.trim() || palette.pub },
    matchScore: hit.score ?? null,
  };
}

// ---------- cache ----------

async function loadCache() {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(await readFile(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function saveCache(cache) {
  await mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache), "utf8");
}

/** Um volume já baixado por título serve para uma entrada que agora é id. */
function findCachedById(cache, id) {
  for (const value of Object.values(cache)) {
    if (value?.found && value.vol?.id === id) return value;
  }
  return null;
}

// ---------- lista ----------

const VOLUME_ID = /^[A-Za-z0-9_-]{12}$/;

/** Um id do Google tem 12 chars e mistura caixa/dígito - "Libertinagem" não. */
function looksLikeVolumeId(s) {
  return VOLUME_ID.test(s) && (/\d/.test(s) || /[A-Z]/.test(s.slice(1)));
}

/** "Título - Autor" → { title, author }. */
function splitTitleAuthor(text) {
  const parts = String(text).split(/\s+[-–-]\s+/);
  if (parts.length < 2) return null;
  const author = parts.at(-1).trim();
  const title = parts.slice(0, -1).join(" - ").trim();
  return title && author ? { title, author } : null;
}

function parseEntry(raw, note) {
  if (raw && typeof raw === "object") {
    if (raw.id)
      return {
        kind: "id",
        id: String(raw.id),
        ...(splitTitleAuthor(raw.note ?? "") ?? {}),
        raw: raw.note ?? raw.id,
      };
    if (raw.title)
      return {
        kind: "query",
        title: raw.title,
        author: raw.author ?? "",
        raw: `${raw.title} - ${raw.author ?? ""}`,
      };
    return null;
  }

  const line = String(raw).trim();
  if (!line || line.startsWith("#")) return null;

  // o comentário ao lado do id vira o rótulo da entrada ("Título - Autor")
  const named = splitTitleAuthor(note ?? "");
  const asId = (id) => ({
    kind: "id",
    id,
    ...(named ?? {}),
    raw: named ? `${named.title} - ${named.author}` : line,
  });

  const fromUrl = line.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (fromUrl) return asId(fromUrl[1]);

  if (line.startsWith("id:")) return asId(line.slice(3).trim());

  const byTitle = splitTitleAuthor(line);
  if (byTitle) return { kind: "query", ...byTitle, raw: line };

  if (looksLikeVolumeId(line)) return asId(line);

  return null;
}

async function readList(listPath) {
  if (listPath.endsWith(".json")) {
    return {
      items: JSON.parse(await readFile(listPath, "utf8")),
      notes: new Map(),
    };
  }

  const mod = await import(pathToFileURL(listPath).href);
  const items = mod.default ?? mod.books;
  if (!Array.isArray(items))
    throw new Error(
      `${listPath} precisa exportar um array (export default [...])`,
    );

  // relê o arquivo como texto para aproveitar os comentários `"id", // Título - Autor`
  const notes = new Map();
  for (const line of readFileSync(listPath, "utf8").split("\n")) {
    const m = line.match(/^\s*"([^"]+)"\s*,?\s*\/\/\s*(.+?)\s*$/);
    if (m) notes.set(m[1], m[2]);
  }
  return { items, notes };
}

// ---------- modo --candidates ----------

async function showCandidates(text) {
  const parts = text.split(/\s+[-–-]\s+/);
  const want =
    parts.length >= 2
      ? {
          title: parts.slice(0, -1).join(" - ").trim(),
          author: parts.at(-1).trim(),
        }
      : { title: text.trim(), author: "" };

  const queries = want.author
    ? queriesFor(want)
    : [`intitle:${want.title}`, `"${want.title}"`];
  const seen = new Map();
  for (const query of queries) {
    for (const vol of await searchVolumes(query, 12).catch(() => [])) {
      if (!seen.has(vol.id)) seen.set(vol.id, vol);
    }
  }

  const rows = [...seen.values()]
    .map((vol) => ({ vol, score: want.author ? scoreVolume(vol, want) : 0 }))
    .sort((a, b) => b.score - a.score);

  console.log(`\n🔎 ${rows.length} candidatos para "${text}"\n`);
  for (const { vol, score } of rows) {
    const i = vol.volumeInfo ?? {};
    console.log(
      `  "${vol.id}", // ${i.title}${i.subtitle ? ": " + i.subtitle : ""} - ${(i.authors ?? ["?"]).join(", ")}`,
    );
    console.log(
      `      ${i.publisher ?? "sem editora"} · ${i.publishedDate ?? "sem data"} · ` +
        `${i.pageCount ?? "?"}p · ${i.language ?? "?"} · ` +
        `${hasCover(vol) ? "com capa" : "SEM CAPA"}${score ? ` · score ${score}` : ""}`,
    );
    if (hasCover(vol)) {
      console.log(
        `      ${i.imageLinks.thumbnail.replace("http://", "https://")}`,
      );
    }
  }
  console.log(
    `\n${requestCount} requisições. Cole o id escolhido em scripts/data/book-list.mjs\n`,
  );
}

// ---------- main ----------

async function main() {
  loadEnv();

  if (CONFIG.candidates) return showCandidates(CONFIG.candidates);

  const { items: list, notes } = await readList(CONFIG.listPath);
  const skipped = [];
  const entries = [];
  const seen = new Set();

  for (const line of list) {
    const entry = parseEntry(
      line,
      typeof line === "string" ? notes.get(line) : undefined,
    );
    if (!entry) {
      skipped.push({
        raw: String(line),
        reason: "não é id nem 'Título - Autor'",
      });
      continue;
    }
    const key =
      entry.kind === "id"
        ? `id:${entry.id}`
        : `${normTitle(entry.title)}|${norm(entry.author)}`;
    if (seen.has(key)) {
      skipped.push({ raw: entry.raw, reason: "duplicado na lista" });
      continue;
    }
    seen.add(key);
    entries.push({ ...entry, key });
  }

  const cache = await loadCache();

  /** O filtro decide o que vai à rede - o arquivo final sai sempre completo. */
  let budget = CONFIG.limit > 0 ? CONFIG.limit : Infinity;
  function wantsFetch(entry) {
    const cached = cache[entry.key];
    if (
      CONFIG.only.length &&
      !CONFIG.only.some((n) => norm(entry.raw).includes(norm(n)))
    )
      return false;
    if (CONFIG.force) return true;
    if (!cached) return true;
    if (!cached.found) return CONFIG.retryMissing;
    if (CONFIG.refetchNoCover && !hasCover(cached.vol)) return true;
    return false;
  }

  const books = [];
  const missing = [];
  const pending = [];
  const byGoogleId = new Map();

  // entrada que virou id mas cujo volume já foi baixado por título antes
  for (const entry of entries) {
    if (entry.kind !== "id" || cache[entry.key]) continue;
    const reuse = findCachedById(cache, entry.id);
    if (reuse) cache[entry.key] = reuse;
  }

  const pinned = entries.filter((e) => e.kind === "id").length;
  const toFetch = entries.filter(wantsFetch).length;
  console.log(
    `\n📚 ${entries.length} entradas (${pinned} por id, ${entries.length - pinned} por busca) · ` +
      `${Object.keys(cache).length} em cache · ${Math.min(toFetch, budget)} para buscar · delay ${CONFIG.delay}ms\n`,
  );

  let index = 0;
  for (const entry of entries) {
    index++;
    const prefix = `[${String(index).padStart(3)}/${entries.length}]`;
    const label = entry.raw;
    const cached = cache[entry.key];
    let hit = null;

    if (wantsFetch(entry) && budget > 0) {
      budget--;
      process.stdout.write(
        `${prefix} → ${label}${entry.kind === "id" && entry.title ? ` (${entry.id})` : ""} ... `,
      );

      if (entry.kind === "id") {
        try {
          const vol = await getVolumeById(entry.id);
          hit = { vol, score: null, query: `id:${entry.id}` };
        } catch (err) {
          console.warn(`\n  ! ${err.message}`);
          hit = null;
        }
      } else {
        hit = await findVolume(entry);
      }

      cache[entry.key] = hit
        ? {
            found: true,
            vol: hit.vol,
            score: hit.score,
            query: hit.query,
            at: new Date().toISOString(),
          }
        : { found: false, at: new Date().toISOString() };
      console.log(
        hit
          ? `ok${hit.score != null ? ` (${hit.score})` : ""}${hasCover(hit.vol) ? "" : " sem capa"}`
          : "NÃO ENCONTRADO",
      );
      if (index % 10 === 0) await saveCache(cache);
    } else if (cached?.found) {
      hit = { vol: cached.vol, score: cached.score, query: cached.query };
    } else if (cached && !cached.found) {
      missing.push({ entrada: label });
      continue;
    } else {
      pending.push({ entrada: label });
      continue;
    }

    if (!hit) {
      missing.push({ entrada: label });
      continue;
    }

    // dedupe: duas entradas podem cair no mesmo volume do Google
    if (byGoogleId.has(hit.vol.id)) {
      skipped.push({
        raw: label,
        reason: `mesmo volume de "${byGoogleId.get(hit.vol.id)}" (${hit.vol.id})`,
      });
      continue;
    }
    byGoogleId.set(hit.vol.id, label);
    books.push(toBook(entry, hit));
  }

  await saveCache(cache);

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "Google Books API",
    total: books.length,
    books,
  };

  await mkdir(path.dirname(CONFIG.outPath), { recursive: true });
  await writeFile(
    CONFIG.outPath,
    JSON.stringify(payload, null, 2) + "\n",
    "utf8",
  );

  const noCover = books.filter((b) => !b.coverUrl);
  const weak = books.filter(
    (b) => !b.pinned && b.matchScore != null && b.matchScore < 110,
  );

  await writeFile(
    REPORT_PATH,
    JSON.stringify(
      {
        generatedAt: payload.generatedAt,
        requests: requestCount,
        total: books.length,
        fixadosPorId: books.filter((b) => b.pinned).length,
        missing,
        pending,
        skipped,
        semCapa: noCover.map((b) => `"${b.id}", // ${b.title} - ${b.author}`),
        matchFraco: weak.map((b) => ({
          pedido: `${b.requested.title} - ${b.requested.author}`,
          achado: `${b.title} - ${b.author}`,
          score: b.matchScore,
        })),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  console.log(
    `\n✅ ${books.length} livros → ${path.relative(ROOT, CONFIG.outPath)}`,
  );
  console.log(
    `   ${requestCount} requisições · ${missing.length} não encontrados · ` +
      `${pending.length} ainda não buscados · ${skipped.length} ignorados · ${noCover.length} sem capa`,
  );
  console.log(`   relatório → ${path.relative(ROOT, REPORT_PATH)}\n`);
}

main().catch((err) => {
  console.error("\n💥", err);
  process.exit(1);
});
