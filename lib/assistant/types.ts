import type { Book } from "../types/book";

export type ShelfStatusId =
  "WANT" | "READING" | "READ" | "ABANDONED" | "REREADING";

export interface BookCard {
  id: string;
  title: string;
  author: string;
  year: string | null;
  pages: number | null;
  status: ShelfStatusId | null;
  rating: number | null;
  cover: Book;
}

export type ActionKind =
  | "shelf_status"
  | "finish_book"
  | "log_session"
  | "review"
  | "quote"
  | "create_list"
  | "add_to_list"
  | "goal"
  | "challenge"
  | "loan";

export interface ActionCard {
  id: string;
  kind: ActionKind;
  title: string;
  detail: string;
  params: Record<string, unknown>;
  book: BookCard | null;
  status: "pending" | "done" | "dismissed" | "failed";
  result: string | null;
  href: string | null;
}

export type Block =
  | { type: "books"; title: string | null; books: BookCard[]; at?: number }
  | { type: "action"; action: ActionCard; at?: number };

export type StreamEvent =
  | { type: "thread"; threadId: string; title: string; messageId: string }
  | { type: "status"; label: string }
  | { type: "delta"; text: string }
  | { type: "block"; block: Block }
  | { type: "done"; messageId: string | null; remaining: number }
  | { type: "error"; message: string };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  blocks: Block[];
  createdAt: string;
}
