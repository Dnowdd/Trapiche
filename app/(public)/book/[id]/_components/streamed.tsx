import {
  byAuthor,
  editionsOf,
  relatedBooks,
  type BookPageData,
} from "@/lib/queries/book";
import ByAuthor from "./by-author";
import Editions from "./editions";
import Related from "./related";

type Book = BookPageData["book"];

export async function EditionsSlot({
  book,
  languageLabel,
}: {
  book: Book;
  languageLabel: string | null;
}) {
  const editions = await editionsOf(book).catch(() => []);
  return (
    <Editions book={book} languageLabel={languageLabel} editions={editions} />
  );
}

export async function MoreSlot({ book }: { book: Book }) {
  const author = book.authors[0] ?? null;
  const [authorBlock, related] = await Promise.all([
    byAuthor(book.id, book.title, author).catch(() => null),
    relatedBooks(book.id, book.categories, author).catch(() => []),
  ]);
  if (!authorBlock && related.length === 0) return null;
  return (
    <div className="mt-14 pt-12 border-t border-(--rule) flex flex-col gap-14">
      <ByAuthor data={authorBlock} />
      {related.length > 0 && <Related books={related} />}
    </div>
  );
}

function CoverRowSkeleton({ count }: { count: number }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-28 sm:w-36 shrink-0 flex flex-col gap-2">
          <div className="aspect-2/3 rounded bg-[rgba(67,62,18,0.07)] animate-pulse" />
          <div className="h-3 w-4/5 rounded bg-[rgba(67,62,18,0.07)] animate-pulse" />
          <div className="h-2.5 w-1/2 rounded bg-[rgba(67,62,18,0.05)] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function SkeletonHeader() {
  return (
    <div className="mb-4">
      <div className="h-2.5 w-20 rounded bg-[rgba(67,62,18,0.07)] animate-pulse mb-2" />
      <div className="h-5 w-48 rounded bg-[rgba(67,62,18,0.09)] animate-pulse" />
    </div>
  );
}

export function EditionsSkeleton() {
  return (
    <div aria-hidden>
      <SkeletonHeader />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="aspect-2/3 rounded bg-[rgba(67,62,18,0.07)] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export function MoreSkeleton() {
  return (
    <div
      aria-hidden
      className="mt-14 pt-12 border-t border-(--rule) flex flex-col gap-14"
    >
      <div>
        <SkeletonHeader />
        <CoverRowSkeleton count={6} />
      </div>
    </div>
  );
}
