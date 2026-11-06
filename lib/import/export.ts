type Status = "WANT" | "READING" | "READ" | "ABANDONED" | "REREADING";

export interface ExportRow {
  id: string;
  title: string;
  authors: string[];
  isbn10: string | null;
  isbn13: string | null;
  publisher: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  status: Status;
  addedAt: Date;
  readAt: Date | null;
  readCount: number;
  rating: number | null;
  review: string | null;
  spoiler: boolean;
  tags: string[];
}

const HEADERS = [
  "Book Id",
  "Title",
  "Author",
  "Additional Authors",
  "ISBN",
  "ISBN13",
  "My Rating",
  "Publisher",
  "Number of Pages",
  "Year Published",
  "Date Read",
  "Date Added",
  "Bookshelves",
  "Exclusive Shelf",
  "My Review",
  "Spoiler",
  "Read Count",
];

const SHELF: Record<Status, string> = {
  WANT: "to-read",
  READING: "currently-reading",
  REREADING: "currently-reading",
  READ: "read",
  ABANDONED: "did-not-finish",
};

const day = (d: Date | null) =>
  d ? d.toISOString().slice(0, 10).replaceAll("-", "/") : "";

function cell(value: string | number | null | undefined) {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

const isbn = (v: string | null) => (v ? `="${v}"` : "");

export function toGoodreadsCsv(rows: ExportRow[]) {
  const lines = rows.map((r) => {
    const shelf = SHELF[r.status];
    const shelves = [
      ...new Set([shelf, ...r.tags.map((t) => t.replace(/\s+/g, "-"))]),
    ];
    return [
      r.id,
      r.title,
      r.authors[0] ?? "",
      r.authors.slice(1).join(", "),
      isbn(r.isbn10),
      isbn(r.isbn13),
      r.rating != null ? Math.round(r.rating) : 0,
      r.publisher,
      r.pageCount,
      r.publishedDate?.slice(0, 4),
      day(r.readAt),
      day(r.addedAt),
      shelves.join(", "),
      shelf,
      r.review,
      r.spoiler ? "true" : "",
      r.readCount,
    ]
      .map(cell)
      .join(",");
  });
  return `﻿${[HEADERS.join(","), ...lines].join("\n")}\n`;
}
