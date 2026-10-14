"use client";

import { useAction } from "@/components/reading/use-action";
import { toast } from "@/components/shared/toast";
import { removeBookFromList } from "@/lib/actions/lists";

export default function RemoveItem({
  listId,
  bookId,
}: {
  listId: string;
  bookId: string;
}) {
  const { pending, run } = useAction();
  return (
    <button
      type="button"
      aria-label="Tirar da lista"
      title="Tirar da lista"
      disabled={pending}
      onClick={() =>
        run(() => removeBookFromList(listId, bookId), undefined, toast)
      }
      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[rgba(0,0,0,0.6)] text-(--cream) flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150 cursor-pointer z-2 disabled:cursor-wait"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}
