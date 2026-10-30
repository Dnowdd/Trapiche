import { isOpenLibraryId } from "../open-library";
import { appUrl } from "../emails/layout";

export const apiBookSelect = {
  id: true,
  title: true,
  authors: true,
  isbn13: true,
  isbn10: true,
  pageCount: true,
  publisher: true,
  publishedDate: true,
  coverUrl: true,
} as const;

export function apiBook(b: {
  id: string;
  title: string;
  authors: string[];
  isbn13: string | null;
  isbn10: string | null;
  pageCount: number | null;
  publisher: string | null;
  publishedDate: string | null;
  coverUrl: string | null;
}) {
  const open = isOpenLibraryId(b.id);
  return {
    id: b.id,
    source: open ? "open_library" : "google_books",
    title: b.title,
    authors: b.authors,
    isbn13: b.isbn13,
    isbn10: b.isbn10,
    pageCount: b.pageCount,
    ...(open
      ? {
          publisher: b.publisher,
          publishedDate: b.publishedDate,
          coverUrl: b.coverUrl,
        }
      : {}),
    url: appUrl(`/book/${b.id}`),
  };
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export function partialDate(
  date: Date | null,
  precision: "DAY" | "MONTH" | "YEAR",
) {
  if (!date) return null;
  const day = date.toISOString().slice(0, 10);
  return precision === "YEAR"
    ? day.slice(0, 4)
    : precision === "MONTH"
      ? day.slice(0, 7)
      : day;
}

export { iso };
