import { toCover, volumeToRow } from "../books";
import { bestCover } from "../cover-probe";
import { cleanAuthor, groupWorks, normalize, workKey } from "../editions";
import { searchPages } from "../google-books";
import {
  findPublisherWorks,
  getAuthorProfile,
  publisherCore,
  searchOpenLibraryPt,
  withoutOpenLibraryDuplicates,
} from "../open-library";
import type { GoogleBooksVolume } from "../types/book";

const MAX_WORKS = 60;

const squash = (s: string) => normalize(cleanAuthor(s)).replace(/ /g, "");

async function toWorks(volumes: GoogleBooksVolume[]) {
  const works = groupWorks(volumes, "").slice(0, MAX_WORKS);
  return Promise.all(
    works.map(async ({ main, editions }) => {
      const row = volumeToRow(main);
      const years = editions
        .map((e) => e.volumeInfo.publishedDate?.slice(0, 4))
        .filter((y): y is string => Boolean(y))
        .sort();
      return {
        cover: toCover({ ...row, coverUrl: await bestCover(row.coverUrl) }),
        year: years.length ? years[0] : null,
        editions: editions.length,
      };
    }),
  );
}

export type PersonWork = Awaited<ReturnType<typeof toWorks>>[number];

export async function getAuthorPage(name: string) {
  const key = squash(name);
  const byName = (v: GoogleBooksVolume) =>
    v.volumeInfo.authors?.some((a) => squash(a) === key) ?? false;
  const [google, openLibrary] = await Promise.all([
    searchPages(`inauthor:"${name}"`).then(async (vols) =>
      vols.length ? vols : searchPages(name),
    ),
    searchOpenLibraryPt(`author:"${name}"`, 100),
  ]);
  const own = [
    ...openLibrary,
    ...withoutOpenLibraryDuplicates(openLibrary, google, name),
  ].filter(byName);
  if (!own.length) return null;

  const canonical = cleanAuthor(
    own[0].volumeInfo.authors?.find((a) => squash(a) === key) ?? name,
  );
  const [works, profile] = await Promise.all([
    toWorks(own),
    getAuthorProfile(canonical).catch(() => null),
  ]);
  return { name: canonical, profile, works };
}

export async function getPublisherPage(name: string) {
  const key = normalize(publisherCore(name));
  const matches = (publisher?: string) => {
    if (!publisher) return false;
    const n = normalize(publisher);
    return n.includes(key) || key.includes(n);
  };
  const [google, openLibrary] = await Promise.all([
    searchPages(name, 2).then((vols) =>
      vols.filter((v) => matches(v.volumeInfo.publisher)),
    ),
    findPublisherWorks(name).catch(() => []),
  ]);
  const works: PersonWork[] = [];
  const seen = new Set<string>();
  for (const d of openLibrary) {
    if (works.length >= MAX_WORKS) break;
    const k = workKey(d.title, d.author ?? undefined);
    if (seen.has(k)) continue;
    seen.add(k);
    works.push({
      cover: toCover({
        id: d.id,
        title: d.title,
        authors: d.author ? [d.author] : [],
        pageCount: null,
        coverUrl: d.coverUrl,
        publisher: name,
      }),
      year: d.year,
      editions: 1,
    });
  }
  for (const w of await toWorks(google)) {
    if (works.length >= MAX_WORKS) break;
    const k = workKey(w.cover.title, w.cover.author);
    if (seen.has(k)) continue;
    seen.add(k);
    works.push(w);
  }
  const covered = works.filter((w) => w.cover.coverUrl);
  const shown = covered.length >= 12 ? covered : works;
  if (!shown.length) return null;
  const canonical = google[0]?.volumeInfo.publisher ?? name;
  shown.sort(
    (a, b) =>
      Number(Boolean(b.cover.coverUrl)) - Number(Boolean(a.cover.coverUrl)),
  );
  return { name: canonical, works: shown };
}
