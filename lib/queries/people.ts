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

const GOOGLE_FILL_BELOW = 12;

async function googleExtras(
  google: GoogleBooksVolume[],
  shown: PersonWork[],
  author?: string,
) {
  if (shown.length >= GOOGLE_FILL_BELOW) return [];
  const seen = new Set(shown.map((w) => workKey(w.cover.title, author)));
  const extras: GoogleBooksVolume[] = [];
  for (const v of google) {
    const k = workKey(v.volumeInfo.title, author);
    if (seen.has(k) || !v.volumeInfo.imageLinks) continue;
    seen.add(k);
    extras.push(v);
    if (extras.length >= GOOGLE_FILL_BELOW) break;
  }
  return Promise.all(
    extras.map(async (v) => {
      const row = volumeToRow(v);
      return {
        cover: toCover({ ...row, coverUrl: await bestCover(row.coverUrl) }),
        year: row.publishedDate?.slice(0, 4) ?? null,
        editions: 1,
      };
    }),
  );
}

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
  const ownOpen = openLibrary.filter(byName);
  const ownGoogle = withoutOpenLibraryDuplicates(
    ownOpen,
    google.filter(byName),
    name,
  );
  if (!ownOpen.length && !ownGoogle.length) return null;

  const canonical = cleanAuthor(
    (ownOpen[0] ?? ownGoogle[0]).volumeInfo.authors?.find(
      (a) => squash(a) === key,
    ) ?? name,
  );
  const works = await toWorks(ownOpen);
  const [googleWorks, profile] = await Promise.all([
    googleExtras(ownGoogle, works, canonical),
    getAuthorProfile(canonical).catch(() => null),
  ]);
  return { name: canonical, profile, works, googleWorks };
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
  const covered = works.filter((w) => w.cover.coverUrl);
  const shown = covered.length >= 12 ? covered : works;
  shown.sort(
    (a, b) =>
      Number(Boolean(b.cover.coverUrl)) - Number(Boolean(a.cover.coverUrl)),
  );
  const googleWorks = await googleExtras(google, shown);
  if (!shown.length && !googleWorks.length) return null;
  const canonical = google[0]?.volumeInfo.publisher ?? name;
  return { name: canonical, works: shown, googleWorks };
}
