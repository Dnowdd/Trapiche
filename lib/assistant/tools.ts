import { randomUUID } from "node:crypto";
import { db } from "../db";
import { cleanAuthors, loadBook, toCover } from "../books";
import { sameTitle } from "../editions";
import { smartSearch } from "../google-books";
import { editionIds } from "../works";
import { today, toISODay } from "../dates";
import { getEstante, getReadingNow, SHELF_LABEL } from "../queries/profile";
import { getGoal, getRetrospective } from "../queries/stats";
import { getRetroStats } from "../queries/retro-stats";
import { getChallenges } from "../queries/challenges";
import { getOpenLoans } from "../queries/loans";
import { getRecommendations } from "../queries/recommendations";
import { FORMAT_LABEL } from "../progress";
import { CHALLENGE_KINDS, describeChallenge } from "../challenges";
import { ACCOUNT_TOOLS, SHELF_STATUSES } from "./tool-defs";
import type { ActionCard, ActionKind, Block, BookCard } from "./types";

export interface ToolContext {
  userId: string;
  shareData: boolean;
  emit: (block: Block) => void;
}

const clip = (s: string | null | undefined, n: number) =>
  s ? (s.length > n ? `${s.slice(0, n - 1)}…` : s) : null;

async function shelfIndex(userId: string) {
  const rows = await db.userBook.findMany({
    where: { userId, status: { not: null } },
    select: {
      bookId: true,
      status: true,
      book: { select: { workId: true, title: true } },
    },
  });
  const reviews = await db.review.findMany({
    where: { userId },
    select: { bookId: true, rating: true, book: { select: { workId: true } } },
  });
  return {
    statusOf(book: { id: string; workId?: string | null; title: string }) {
      const hit =
        rows.find((r) => r.bookId === book.id) ??
        (book.workId
          ? rows.find((r) => r.book.workId === book.workId)
          : undefined) ??
        rows.find((r) => sameTitle(r.book.title, book.title));
      return hit?.status ?? null;
    },
    ratingOf(book: { id: string; workId?: string | null }) {
      const hit =
        reviews.find((r) => r.bookId === book.id) ??
        (book.workId
          ? reviews.find((r) => r.book.workId === book.workId)
          : undefined);
      return hit?.rating ?? null;
    },
  };
}

async function bookCard(
  id: string,
  index?: Awaited<ReturnType<typeof shelfIndex>>,
): Promise<BookCard | null> {
  const book = await loadBook(id).catch(() => null);
  if (!book) return null;
  const workId = (book as { workId?: string | null }).workId ?? null;
  const cover = toCover(book);
  const status = index?.statusOf({ id, workId, title: book.title }) ?? null;
  return {
    id,
    title: book.title,
    author: cover.author,
    year: book.publishedDate?.slice(0, 4) ?? null,
    pages: book.pageCount ?? null,
    status,
    rating: index?.ratingOf({ id, workId }) ?? null,
    cover,
  };
}

function validDay(raw: unknown) {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || toISODay(d) !== raw ? null : raw;
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function propose(
  ctx: ToolContext,
  kind: ActionKind,
  title: string,
  detail: string,
  params: Record<string, unknown>,
  book: BookCard | null,
) {
  const action: ActionCard = {
    id: randomUUID(),
    kind,
    title,
    detail,
    params,
    book,
    status: "pending",
    result: null,
    href: null,
  };
  ctx.emit({ type: "action", action });
  return {
    status: "awaiting_user_confirmation",
    summary: ctx.shareData
      ? `${title}${detail ? ` — ${detail}` : ""}`
      : `${kind}${book ? `: ${book.title}` : ""}`,
    note: "Um cartão com botão Confirmar apareceu para o usuário. Nada foi salvo ainda. Diga em uma frase o que vai acontecer quando ele confirmar.",
  };
}

const fail = (message: string) => ({ error: message });

async function currentEntry(userId: string, bookId: string) {
  return db.userBook.findFirst({
    where: {
      userId,
      bookId: { in: await editionIds(bookId) },
      status: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    select: { bookId: true, status: true, format: true },
  });
}

async function requireBook(id: unknown) {
  if (typeof id !== "string" || !id) return null;
  return bookCard(id);
}

type Args = Record<string, unknown>;

export async function runTool(
  name: string,
  args: Args,
  ctx: ToolContext,
): Promise<unknown> {
  const { userId } = ctx;
  if (!ctx.shareData && ACCOUNT_TOOLS.has(name))
    return fail("O leitor não autorizou o uso dos dados da conta.");
  switch (name) {
    case "search_books": {
      const query = String(args.query ?? "").trim();
      if (query.length < 2) return fail("Busca curta demais.");
      const { works, google } = await smartSearch(query, 6);
      const index = await shelfIndex(userId);
      const volumes = [
        ...works.map((w) => ({ v: w.main, editions: w.editions.length })),
        ...google.map((v) => ({ v, editions: 1 })),
      ].slice(0, 6);
      return {
        results: volumes.map(({ v, editions }) => ({
          id: v.id,
          title: v.volumeInfo.title,
          authors: cleanAuthors(v.volumeInfo.authors ?? []).slice(0, 3),
          year: v.volumeInfo.publishedDate?.slice(0, 4) ?? null,
          pages: v.volumeInfo.pageCount ?? null,
          editions,
          ...(ctx.shareData
            ? {
                my_status: index.statusOf({
                  id: v.id,
                  title: v.volumeInfo.title,
                }),
              }
            : {}),
        })),
      };
    }
    case "discover_books": {
      const max = typeof args.max_pages === "number" ? args.max_pages : null;
      const min = typeof args.min_pages === "number" ? args.min_pages : null;
      const language = typeof args.language === "string" ? args.language : null;
      const subject =
        typeof args.subject === "string"
          ? args.subject.trim().toLowerCase()
          : "";
      const rows = await db.book.findMany({
        where: {
          ...(max || min
            ? { pageCount: { ...(max ? { lte: max } : {}), gte: min ?? 1 } }
            : {}),
          ...(language ? { language: { startsWith: language } } : {}),
        },
        orderBy: { shelf: { _count: "desc" } },
        take: 400,
        select: {
          id: true,
          title: true,
          authors: true,
          pageCount: true,
          publishedDate: true,
          categories: true,
          description: true,
          workId: true,
        },
      });
      const seen = new Set<string>();
      const picked = rows.filter((b) => {
        const key = b.workId ?? b.id;
        if (seen.has(key)) return false;
        if (
          subject &&
          !`${b.categories.join(" ")} ${b.description ?? ""}`
            .toLowerCase()
            .includes(subject)
        )
          return false;
        seen.add(key);
        return true;
      });
      return {
        books: picked.slice(0, 15).map((b) => ({
          id: b.id,
          title: b.title,
          authors: cleanAuthors(b.authors).slice(0, 2),
          pages: b.pageCount,
          year: b.publishedDate?.slice(0, 4) ?? null,
          categories: b.categories.slice(0, 3),
        })),
        note: picked.length
          ? "Livros do catálogo do Trapiche. Você também pode sugerir outros e buscá-los por título."
          : "Nada no catálogo com esses filtros. Sugira títulos pelo seu conhecimento e busque cada um com search_books.",
      };
    }
    case "get_book": {
      const id = String(args.book_id ?? "");
      const book = await loadBook(id).catch(() => null);
      if (!book)
        return fail(
          "Livro não encontrado. Use search_books para achar o id certo.",
        );
      const ids = await editionIds(id);
      const [community, entry, quotes, review] = await Promise.all([
        db.review.aggregate({
          where: { bookId: { in: ids }, hiddenAt: null },
          _avg: { rating: true },
          _count: { rating: true },
        }),
        db.userBook.findFirst({
          where: { userId, bookId: { in: ids } },
          orderBy: { updatedAt: "desc" },
          select: {
            status: true,
            currentPage: true,
            format: true,
            progressPercent: true,
            liked: true,
          },
        }),
        db.quote.count({ where: { userId, bookId: { in: ids } } }),
        db.review.findFirst({
          where: { userId, bookId: { in: ids } },
          select: { rating: true, text: true },
        }),
      ]);
      return {
        id,
        title: book.title,
        subtitle: book.subtitle,
        authors: cleanAuthors(book.authors),
        year: book.publishedDate?.slice(0, 4) ?? null,
        pages: book.pageCount,
        language: book.language,
        publisher: book.publisher,
        categories: book.categories.slice(0, 5),
        synopsis: clip(book.description, 1400),
        community: {
          average_rating: community._avg.rating
            ? Math.round(community._avg.rating * 10) / 10
            : null,
          ratings: community._count.rating,
        },
        me:
          ctx.shareData && entry
            ? {
                status: entry.status ? SHELF_LABEL[entry.status] : null,
                format: FORMAT_LABEL[entry.format],
                current_page: entry.currentPage,
                percent: entry.progressPercent,
                liked: entry.liked,
                my_rating: review?.rating ?? null,
                my_review: clip(review?.text, 400),
                quotes_saved: quotes,
              }
            : null,
        url: `/book/${id}`,
      };
    }
    case "get_my_shelf": {
      const status = typeof args.status === "string" ? args.status : null;
      const query =
        typeof args.query === "string" ? args.query.toLowerCase() : null;
      const limit = Math.min(60, Math.max(1, Number(args.limit) || 30));
      const [items, tags] = await Promise.all([
        getEstante(userId, true),
        db.tag.findMany({
          where: { userId },
          select: { id: true, name: true },
        }),
      ]);
      const filtered = items.filter(
        (i) =>
          (!status || i.status === status) &&
          (!query ||
            `${i.book.title} ${i.book.author}`.toLowerCase().includes(query)),
      );
      const counts = Object.fromEntries(
        SHELF_STATUSES.map((s) => [
          s,
          items.filter((i) => i.status === s).length,
        ]),
      );
      return {
        totals: counts,
        books: filtered.slice(0, limit).map((i) => ({
          id: i.book.id,
          title: i.book.title,
          author: i.book.author,
          pages: i.book.pages || null,
          status: SHELF_LABEL[i.status],
          rating: i.rating,
          progress_percent: i.progress,
          finished: i.finishedAt ? toISODay(new Date(i.finishedAt)) : null,
          tags: i.tags
            .map((t) => tags.find((x) => x.id === t)?.name)
            .filter(Boolean),
          lent_to: i.lentTo,
        })),
        truncated: filtered.length > limit,
      };
    }
    case "get_reading_now": {
      const rows = await getReadingNow(userId);
      return {
        reading: rows.map((r) => ({
          id: r.book.id,
          title: r.book.title,
          author: r.book.author,
          format: FORMAT_LABEL[r.format],
          progress: r.known ? `${r.progress}%` : r.short,
          started: r.started,
          expected_finish: r.expected,
        })),
      };
    }
    case "get_reading_stats": {
      const now = today();
      const year = Number(args.year) || now.getUTCFullYear();
      const month =
        typeof args.month === "number" && args.month >= 1 && args.month <= 12
          ? args.month
          : undefined;
      if (year < 1900 || year > now.getUTCFullYear())
        return fail("Ano inválido.");
      const [retro, stats, goal] = await Promise.all([
        getRetrospective(userId, year, month),
        getRetroStats(userId, year, month),
        getGoal(userId, year),
      ]);
      return {
        period: retro.label,
        totals: retro.totals,
        top_authors: retro.authors,
        top_genres: retro.genres,
        books: retro.books.slice(0, 40).map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          rating: b.rating,
        })),
        average_rating: stats.average,
        languages: stats.languages,
        formats: stats.formats,
        decades: stats.decades,
        average_pages: stats.averagePages,
        pages_by_month: stats.byMonth?.map((m) => ({
          month: m.month,
          pages: m.pages,
        })),
        goal: goal.target
          ? { target: goal.target, done: goal.done, pace: goal.pace }
          : null,
      };
    }
    case "get_my_reviews_and_quotes": {
      const bookId = typeof args.book_id === "string" ? args.book_id : null;
      const ids = bookId ? await editionIds(bookId) : null;
      const where = { userId, ...(ids ? { bookId: { in: ids } } : {}) };
      const [reviews, quotes] = await Promise.all([
        db.review.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          take: 40,
          select: {
            rating: true,
            text: true,
            book: { select: { id: true, title: true } },
          },
        }),
        db.quote.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 40,
          select: {
            text: true,
            page: true,
            book: { select: { id: true, title: true } },
          },
        }),
      ]);
      return {
        reviews: reviews.map((r) => ({
          book_id: r.book.id,
          book: r.book.title,
          rating: r.rating,
          text: clip(r.text, 500),
        })),
        quotes: quotes.map((q) => ({
          book_id: q.book.id,
          book: q.book.title,
          page: q.page,
          text: clip(q.text, 400),
        })),
      };
    }
    case "get_recommendations": {
      const recs = await getRecommendations(userId, 10);
      return {
        recommendations: recs.map((r) => ({
          id: r.book.id,
          title: r.book.title,
          author: r.book.author,
          pages: r.book.pages || null,
          reason: r.reason,
        })),
      };
    }
    case "get_goals_challenges_loans": {
      const year = today().getUTCFullYear();
      const [goal, challenges, loans, lists] = await Promise.all([
        getGoal(userId, year),
        getChallenges(userId),
        getOpenLoans(userId),
        db.list.findMany({
          where: { members: { some: { userId } } },
          orderBy: { updatedAt: "desc" },
          take: 30,
          select: {
            id: true,
            title: true,
            visibility: true,
            ownerId: true,
            _count: { select: { items: true } },
          },
        }),
      ]);
      return {
        goal: { year, target: goal.target, done: goal.done, pace: goal.pace },
        challenges: challenges.map((c) => ({
          title: c.title,
          rule: `${c.target} livros ${c.detail}`,
          done: c.done,
          target: c.target,
          until: c.endsAt,
          complete: c.complete,
        })),
        loans: loans.map((l) => ({
          book: l.book.title,
          person: l.person,
          since: l.lentAt,
          due: l.dueAt,
          overdue: l.overdue,
        })),
        lists: lists.map((l) => ({
          id: l.id,
          title: l.title,
          visibility: l.visibility,
          books: l._count.items,
          mine: l.ownerId === userId,
        })),
      };
    }
    case "show_books": {
      const ids = Array.isArray(args.book_ids)
        ? [
            ...new Set(
              args.book_ids.filter((x): x is string => typeof x === "string"),
            ),
          ].slice(0, 8)
        : [];
      if (!ids.length) return fail("Informe ids de livros.");
      const index = await shelfIndex(userId);
      const cards = (
        await Promise.all(ids.map((id) => bookCard(id, index)))
      ).filter((c): c is BookCard => c != null);
      if (!cards.length)
        return fail("Nenhum desses ids existe. Busque os livros antes.");
      ctx.emit({
        type: "books",
        title: typeof args.title === "string" ? clip(args.title, 60) : null,
        books: cards,
      });
      return {
        shown: cards.map((c) => ({
          id: c.id,
          title: c.title,
          author: c.author,
          pages: c.pages,
          year: c.year,
        })),
        missing: ids.length - cards.length,
      };
    }
    case "propose_shelf_status": {
      const book = await requireBook(args.book_id);
      if (!book) return fail("Livro não encontrado.");
      const status = args.status === "READING" ? "READING" : "WANT";
      const entry = await currentEntry(userId, book.id);
      if (entry?.status === status)
        return fail(
          `Esse livro já está como “${SHELF_LABEL[status]}”. Não precisa mudar nada.`,
        );
      return propose(
        ctx,
        "shelf_status",
        status === "READING" ? "Começar a ler" : "Colocar em “Quero ler”",
        entry?.status
          ? `${book.title} · hoje está como “${SHELF_LABEL[entry.status]}”`
          : book.title,
        { bookId: entry?.bookId ?? book.id, status },
        book,
      );
    }
    case "propose_finish_book": {
      const book = await requireBook(args.book_id);
      if (!book) return fail("Livro não encontrado.");
      const rating =
        typeof args.rating === "number"
          ? Math.round(args.rating * 2) / 2
          : null;
      if (rating != null && (rating < 0.5 || rating > 5))
        return fail("Nota inválida.");
      const finishedOn = validDay(args.finished_on) ?? toISODay(today());
      if (finishedOn > toISODay(today()))
        return fail("A data de término não pode ser no futuro.");
      const review =
        typeof args.review === "string"
          ? args.review.trim().slice(0, 5000)
          : null;
      if (review && rating == null)
        return fail(
          "Para guardar a resenha junto, preciso da nota (0,5 a 5). Pergunte ao leitor.",
        );
      const entry = await currentEntry(userId, book.id);
      return propose(
        ctx,
        "finish_book",
        entry?.status === "READ" ? "Registrar releitura" : "Marcar como lido",
        [
          book.title,
          `terminado em ${fmtDate(finishedOn)}`,
          rating ? `nota ${rating.toLocaleString("pt-BR")} ★` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        { bookId: entry?.bookId ?? book.id, rating, review, finishedOn },
        book,
      );
    }
    case "propose_log_session": {
      const book = await requireBook(args.book_id);
      if (!book) return fail("Livro não encontrado.");
      const minutes = Number(args.minutes);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)
        return fail("Minutos inválidos.");
      const date = validDay(args.date) ?? toISODay(today());
      if (date > toISODay(today()))
        return fail("A data não pode ser no futuro.");
      const entry = await currentEntry(userId, book.id);
      if (entry?.status !== "READING" && entry?.status !== "REREADING")
        return fail(
          "O livro não está como “Lendo”. Proponha antes propose_shelf_status com READING.",
        );
      const needs = {
        PRINT: "page_end",
        EBOOK: "percent_end",
        AUDIO: "audio_position_minutes",
      }[entry.format];
      if (typeof args[needs] !== "number")
        return fail(
          `Este livro está no formato ${FORMAT_LABEL[entry.format]}. Informe ${needs}.`,
        );
      const where =
        typeof args.percent_end === "number"
          ? `até ${args.percent_end}%`
          : typeof args.audio_position_minutes === "number"
            ? `até ${args.audio_position_minutes} min ouvidos`
            : typeof args.page_end === "number"
              ? `até a página ${args.page_end}`
              : null;
      if (!where)
        return fail("Informe page_end, percent_end ou audio_position_minutes.");
      return propose(
        ctx,
        "log_session",
        "Registrar leitura",
        `${book.title} · ${minutes} min · ${where} · ${fmtDate(date)}`,
        {
          bookId: entry.bookId,
          minutes,
          date,
          pageEnd: typeof args.page_end === "number" ? args.page_end : null,
          percentEnd:
            typeof args.percent_end === "number" ? args.percent_end : null,
          audioPosition:
            typeof args.audio_position_minutes === "number"
              ? args.audio_position_minutes
              : null,
        },
        book,
      );
    }
    case "propose_review": {
      const book = await requireBook(args.book_id);
      if (!book) return fail("Livro não encontrado.");
      const rating = Math.round(Number(args.rating) * 2) / 2;
      if (!(rating >= 0.5 && rating <= 5)) return fail("Nota inválida.");
      const text =
        typeof args.text === "string" ? args.text.trim().slice(0, 5000) : null;
      return propose(
        ctx,
        "review",
        "Salvar avaliação",
        `${book.title} · ${rating.toLocaleString("pt-BR")} ★${text ? " · com resenha" : ""}`,
        { bookId: book.id, rating, text },
        book,
      );
    }
    case "propose_quote": {
      const book = await requireBook(args.book_id);
      if (!book) return fail("Livro não encontrado.");
      const text = String(args.text ?? "").trim();
      if (!text) return fail("Trecho vazio.");
      if (text.length > 1200)
        return fail("Trecho longo demais para uma citação.");
      const page = typeof args.page === "number" ? args.page : null;
      return propose(
        ctx,
        "quote",
        "Guardar citação",
        `“${clip(text, 120)}” · ${book.title}${page ? `, p. ${page}` : ""}`,
        { bookId: book.id, text, page },
        book,
      );
    }
    case "propose_create_list": {
      const title = String(args.title ?? "")
        .trim()
        .slice(0, 100);
      if (!title) return fail("Dê um nome para a lista.");
      const ids = Array.isArray(args.book_ids)
        ? [
            ...new Set(
              args.book_ids.filter((x): x is string => typeof x === "string"),
            ),
          ].slice(0, 30)
        : [];
      const cards = (await Promise.all(ids.map((id) => bookCard(id)))).filter(
        (c): c is BookCard => c != null,
      );
      const visibility = args.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC";
      return propose(
        ctx,
        "create_list",
        "Criar lista",
        `“${title}” · ${cards.length} ${cards.length === 1 ? "livro" : "livros"} · ${visibility === "PUBLIC" ? "pública" : "privada"}`,
        {
          title,
          note: typeof args.note === "string" ? args.note.slice(0, 500) : null,
          visibility,
          bookIds: cards.map((c) => c.id),
        },
        cards[0] ?? null,
      );
    }
    case "propose_add_to_list": {
      const list = await db.list.findFirst({
        where: {
          id: String(args.list_id ?? ""),
          members: { some: { userId } },
        },
        select: { id: true, title: true },
      });
      if (!list) return fail("Lista não encontrada entre as do usuário.");
      const ids = Array.isArray(args.book_ids)
        ? [
            ...new Set(
              args.book_ids.filter((x): x is string => typeof x === "string"),
            ),
          ].slice(0, 30)
        : [];
      const cards = (await Promise.all(ids.map((id) => bookCard(id)))).filter(
        (c): c is BookCard => c != null,
      );
      if (!cards.length) return fail("Nenhum livro válido.");
      return propose(
        ctx,
        "add_to_list",
        `Adicionar à lista “${list.title}”`,
        cards.map((c) => c.title).join(", "),
        { listId: list.id, bookIds: cards.map((c) => c.id) },
        cards[0],
      );
    }
    case "propose_goal": {
      const year = Number(args.year);
      const target = Number(args.target);
      if (!Number.isInteger(target) || target < 1 || target > 1000)
        return fail("Meta inválida.");
      return propose(
        ctx,
        "goal",
        "Definir meta anual",
        `${target} livros em ${year}`,
        { year, target },
        null,
      );
    }
    case "propose_challenge": {
      const kind = String(
        args.kind ?? "ANY",
      ) as (typeof CHALLENGE_KINDS)[number];
      if (!CHALLENGE_KINDS.includes(kind) || kind === "TAG")
        return fail("Tipo inválido.");
      const target = Number(args.target);
      const startsOn = validDay(args.starts_on);
      const endsOn = validDay(args.ends_on);
      if (!startsOn || !endsOn) return fail("Datas inválidas.");
      const value = typeof args.value === "string" ? args.value : null;
      const title = String(args.title ?? "")
        .trim()
        .slice(0, 80);
      return propose(
        ctx,
        "challenge",
        "Criar desafio",
        `“${title}” · ${target} livros ${describeChallenge(kind, value)} · até ${fmtDate(endsOn)}`,
        { title, kind, value, target, startsAt: startsOn, endsAt: endsOn },
        null,
      );
    }
    case "propose_loan": {
      const book = await requireBook(args.book_id);
      if (!book) return fail("Livro não encontrado.");
      const person = String(args.person ?? "")
        .trim()
        .slice(0, 80);
      if (!person) return fail("Diga com quem está.");
      const open = await db.loan.findFirst({
        where: {
          userId,
          bookId: { in: await editionIds(book.id) },
          returnedAt: null,
        },
        select: { person: true },
      });
      if (open)
        return fail(`Esse livro já está emprestado para ${open.person}.`);
      const dueOn = validDay(args.due_on);
      return propose(
        ctx,
        "loan",
        "Anotar empréstimo",
        `${book.title} com ${person}${dueOn ? ` · devolver até ${fmtDate(dueOn)}` : ""}`,
        { bookId: book.id, person, dueAt: dueOn },
        book,
      );
    }
    default:
      return fail(`Ferramenta desconhecida: ${name}`);
  }
}
