import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ResponseCreateParamsStreaming } from "openai/resources/responses/responses";
import { testDb, viewer } from "./setup";

const openai = vi.hoisted(() => ({
  rounds: [] as ((body: ResponseCreateParamsStreaming) => unknown[])[],
  bodies: [] as ResponseCreateParamsStreaming[],
  fail: null as Error | null,
}));

vi.mock("openai", () => {
  class APIError extends Error {
    constructor(
      readonly status: number,
      message: string,
    ) {
      super(message);
    }
  }
  class OpenAI {
    static APIError = APIError;
    responses = {
      create: async (body: ResponseCreateParamsStreaming) => {
        openai.bodies.push(structuredClone(body));
        if (openai.fail) throw openai.fail;
        const round = openai.rounds[openai.bodies.length - 1];
        const events = round ? round(body) : [];
        return (async function* () {
          for (const e of events) yield e;
        })();
      },
    };
  }
  return { default: OpenAI, APIError };
});

vi.mock("@/lib/google-books", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/google-books")>()),
  getVolume: async () => {
    throw new Error("offline");
  },
  smartSearch: async () => ({
    works: [
      {
        main: {
          id: "book-1",
          volumeInfo: {
            title: "Tudo é rio",
            authors: ["Carla Madeira"],
            publishedDate: "2014",
          },
        },
        editions: [{}],
      },
    ],
    authors: [],
    google: [],
  }),
}));

const { runAssistant, consumeDailyMessage, AssistantRequestError } =
  await import("@/lib/assistant/runner");
const { runTool } = await import("@/lib/assistant/tools");
const {
  confirmAssistantAction,
  dismissAssistantAction,
  setAssistantDataSharing,
  deleteAllAssistantThreads,
  loadAssistantThread,
} = await import("@/lib/actions/assistant");
const { POST } = await import("@/app/api/assistant/route");
import type { Block, StreamEvent } from "@/lib/assistant/types";

const USER = "user-test";

function textRound(text: string) {
  return () => [
    ...text.match(/\S+\s*/g)!.map((delta) => ({
      type: "response.output_text.delta",
      delta,
    })),
    {
      type: "response.completed",
      response: {
        status: "completed",
        output: [
          {
            type: "message",
            id: "msg_1",
            role: "assistant",
            status: "completed",
            content: [{ type: "output_text", text, annotations: [] }],
          },
        ],
        usage: { input_tokens: 100, output_tokens: 20 },
      },
    },
  ];
}

function callRound(name: string, args: Record<string, unknown>) {
  return () => {
    const item = {
      type: "function_call",
      id: `fc_${name}`,
      call_id: `call_${name}`,
      name,
      arguments: JSON.stringify(args),
      status: "completed",
    };
    return [
      { type: "response.output_item.added", item: { ...item, arguments: "" } },
      {
        type: "response.completed",
        response: {
          status: "completed",
          output: [item],
          usage: { input_tokens: 200, output_tokens: 10 },
        },
      },
    ];
  };
}

async function run(
  message: string,
  threadId: string | null = null,
  shareData = true,
) {
  const events: StreamEvent[] = [];
  const result = await runAssistant({
    userId: USER,
    shareData,
    name: "Leitora Teste",
    handle: "teste",
    threadId,
    message,
    bookId: null,
    signal: new AbortController().signal,
    send: (e) => events.push(e),
  });
  return { events, result };
}

beforeEach(() => {
  openai.rounds = [];
  openai.bodies = [];
  openai.fail = null;
  process.env.OPENAI_API_KEY = "test";
});

describe("assistant runner", () => {
  it("streams text and stores the thread, messages and token usage", async () => {
    openai.rounds = [textRound("Oi! Vamos falar de livros?")];
    const { events, result } = await run("  Oi, tudo bem?  ");
    expect(events[0]).toMatchObject({ type: "thread", title: "Oi, tudo bem?" });
    expect(
      events
        .filter((e) => e.type === "delta")
        .map((e) => (e as { text: string }).text)
        .join(""),
    ).toBe("Oi! Vamos falar de livros?");
    const messages = await testDb.assistantMessage.findMany({
      where: { threadId: result.threadId },
      orderBy: { createdAt: "asc" },
    });
    expect(messages.map((m) => m.role)).toEqual(["USER", "ASSISTANT"]);
    expect(messages[1]).toMatchObject({
      id: result.messageId,
      content: "Oi! Vamos falar de livros?",
      inputTokens: 100,
      outputTokens: 20,
    });
    const usage = await testDb.assistantUsage.findFirstOrThrow({
      where: { userId: USER },
    });
    expect(usage).toMatchObject({ inputTokens: 100, outputTokens: 20 });
    const body = openai.bodies[0];
    expect(body).toMatchObject({ store: false, stream: true });
    expect(body.instructions).toContain("Leitora Teste");
    expect(body.safety_identifier).not.toContain(USER);
  });

  it("runs read tools and shows covers from the user's shelf", async () => {
    await testDb.userBook.create({
      data: { userId: USER, bookId: "book-1", status: "WANT" },
    });
    openai.rounds = [
      callRound("get_my_shelf", { status: null, query: null, limit: 10 }),
      callRound("show_books", { book_ids: ["book-1", "nope"], title: "Pilha" }),
      textRound("Esse é ótimo."),
    ];
    const { events, result } = await run("O que tem na minha estante?");

    const shelfOutput = openai.bodies[1].input as {
      type?: string;
      output?: string;
    }[];
    const output = JSON.parse(
      shelfOutput.find((i) => i.type === "function_call_output")!.output!,
    );
    expect(output.books[0]).toMatchObject({
      id: "book-1",
      status: "Quero ler",
    });

    const block = events.find((e) => e.type === "block") as {
      block: Block;
    };
    expect(block.block).toMatchObject({
      type: "books",
      title: "Pilha",
      at: 0,
      books: [{ id: "book-1", title: "Tudo é rio", status: "WANT" }],
    });
    expect(events.filter((e) => e.type === "status").length).toBeGreaterThan(1);

    const saved = await testDb.assistantMessage.findUniqueOrThrow({
      where: { id: result.messageId },
    });
    expect((saved.blocks as unknown as Block[])[0].type).toBe("books");
    expect(saved.inputTokens).toBe(500);

    openai.rounds = [textRound("Claro.")];
    openai.bodies = [];
    await run("e o segundo?", result.threadId);
    const history = JSON.stringify(openai.bodies[0].input);
    expect(history).toContain("⟦capas mostradas: “Tudo é rio” (id book-1)⟧");
  });

  it("creates pending cards that run only after confirmation", async () => {
    openai.rounds = [
      callRound("propose_shelf_status", {
        book_id: "book-1",
        status: "READING",
      }),
      textRound("Deixei pronto para você confirmar."),
    ];
    const { events, result } = await run("Comecei Tudo é rio hoje");
    const card = events.find((e) => e.type === "block") as { block: Block };
    expect(card.block.type).toBe("action");
    const action = card.block.type === "action" ? card.block.action : null;
    expect(action).toMatchObject({ status: "pending", title: "Começar a ler" });
    expect(
      await testDb.userBook.count({
        where: { userId: USER, bookId: "book-1" },
      }),
    ).toBe(0);

    const confirmed = await confirmAssistantAction(
      result.messageId,
      action!.id,
    );
    expect(confirmed).toMatchObject({
      ok: true,
      data: { status: "done", href: "/book/book-1" },
    });
    const entry = await testDb.userBook.findFirstOrThrow({
      where: { userId: USER, bookId: "book-1" },
    });
    expect(entry.status).toBe("READING");

    const again = await confirmAssistantAction(result.messageId, action!.id);
    expect(again).toMatchObject({ ok: true, data: { status: "done" } });
    expect(await testDb.reading.count({ where: { userId: USER } })).toBe(1);

    const thread = await loadAssistantThread(result.threadId);
    const blocks = thread.ok ? thread.data!.messages[1].blocks : [];
    expect(blocks[0]).toMatchObject({ action: { status: "done" } });
  });

  it("dismisses cards and protects them from other users", async () => {
    openai.rounds = [
      callRound("propose_goal", { year: 2026, target: 30 }),
      textRound("Pronto."),
    ];
    const { events, result } = await run("Quero ler 30 livros este ano");
    const card = events.find((e) => e.type === "block") as { block: Block };
    const actionId = card.block.type === "action" ? card.block.action.id : "";

    await testDb.user.create({
      data: {
        id: "intruder",
        name: "Outra",
        email: "outra@example.com",
        emailVerified: true,
        handle: "outra",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    viewer.id = "intruder";
    const stolen = await confirmAssistantAction(result.messageId, actionId);
    expect(stolen.ok).toBe(false);

    viewer.id = USER;
    const dismissed = await dismissAssistantAction(result.messageId, actionId);
    expect(dismissed).toMatchObject({
      ok: true,
      data: { status: "dismissed" },
    });
    const after = await confirmAssistantAction(result.messageId, actionId);
    expect(after).toMatchObject({ ok: true, data: { status: "dismissed" } });
    expect(await testDb.readingGoal.count()).toBe(0);
  });

  it("validates proposals before showing them", async () => {
    const emitted: Block[] = [];
    const ctx = {
      userId: USER,
      shareData: true,
      emit: (b: Block) => emitted.push(b),
    };
    expect(
      await runTool(
        "propose_finish_book",
        { book_id: "book-1", rating: null, review: "Lindo", finished_on: null },
        ctx,
      ),
    ).toHaveProperty("error");
    expect(
      await runTool(
        "propose_review",
        { book_id: "book-1", rating: 9, text: null },
        ctx,
      ),
    ).toHaveProperty("error");
    expect(
      await runTool(
        "propose_loan",
        { book_id: "nope", person: "Ana", due_on: null },
        ctx,
      ),
    ).toHaveProperty("error");
    expect(
      await runTool(
        "propose_finish_book",
        {
          book_id: "book-1",
          rating: 4.4,
          review: null,
          finished_on: "2026-02-30",
        },
        ctx,
      ),
    ).toMatchObject({ status: "awaiting_user_confirmation" });
    const action = emitted[0].type === "action" ? emitted[0].action : null;
    expect(action?.params).toMatchObject({ rating: 4.5 });
    expect(action?.params.finishedOn).not.toBe("2026-02-30");
    expect(emitted).toHaveLength(1);
  });

  it("knows the shelf before proposing", async () => {
    const emitted: Block[] = [];
    const ctx = {
      userId: USER,
      shareData: true,
      emit: (b: Block) => emitted.push(b),
    };
    await testDb.userBook.create({
      data: { userId: USER, bookId: "book-1", status: "READ", format: "EBOOK" },
    });
    expect(
      await runTool(
        "propose_shelf_status",
        { book_id: "book-1", status: "WANT" },
        ctx,
      ),
    ).toMatchObject({ status: "awaiting_user_confirmation" });
    expect(emitted[0]).toMatchObject({
      action: { detail: "Tudo é rio · hoje está como “Lido”" },
    });
    await runTool(
      "propose_finish_book",
      { book_id: "book-1", rating: 5, review: null, finished_on: null },
      ctx,
    );
    expect(emitted[1]).toMatchObject({
      action: { title: "Registrar releitura" },
    });
    const session = {
      book_id: "book-1",
      minutes: 30,
      page_end: 50,
      percent_end: null,
      audio_position_minutes: null,
      date: null,
    };
    expect(await runTool("propose_log_session", session, ctx)).toMatchObject({
      error: expect.stringContaining("Lendo"),
    });
    await testDb.userBook.updateMany({ data: { status: "READING" } });
    expect(await runTool("propose_log_session", session, ctx)).toMatchObject({
      error: expect.stringContaining("percent_end"),
    });
    expect(
      await runTool(
        "propose_log_session",
        { ...session, page_end: null, percent_end: 40 },
        ctx,
      ),
    ).toMatchObject({ status: "awaiting_user_confirmation" });
    expect(
      await runTool(
        "propose_shelf_status",
        { book_id: "book-1", status: "READING" },
        ctx,
      ),
    ).toHaveProperty("error");
  });

  it("keeps account data away from the model without consent", async () => {
    await testDb.userBook.create({
      data: { userId: USER, bookId: "book-1", status: "READ" },
    });
    openai.rounds = [textRound("Posso ajudar com livros em geral.")];
    await run("O que tem na minha estante?", null, false);
    const body = openai.bodies[0];
    const names = (body.tools ?? []).map((t) => (t as { name: string }).name);
    expect(names).not.toContain("get_my_shelf");
    expect(names).not.toContain("get_reading_stats");
    expect(names).toContain("search_books");
    expect(names).toContain("propose_shelf_status");
    expect(body.instructions).not.toContain("Leitora Teste");
    expect(body.instructions).toContain("NÃO autorizou");

    const emitted: Block[] = [];
    const ctx = {
      userId: USER,
      shareData: false,
      emit: (b: Block) => emitted.push(b),
    };
    expect(
      await runTool(
        "get_my_shelf",
        { status: null, query: null, limit: 10 },
        ctx,
      ),
    ).toHaveProperty("error");
    expect(await runTool("get_book", { book_id: "book-1" }, ctx)).toMatchObject(
      { title: "Tudo é rio", me: null },
    );
    const search = (await runTool("search_books", { query: "rio" }, ctx)) as {
      results: Record<string, unknown>[];
    };
    expect(search.results[0]).not.toHaveProperty("my_status");
    const proposal = (await runTool(
      "propose_shelf_status",
      { book_id: "book-1", status: "WANT" },
      ctx,
    )) as { summary: string };
    expect(proposal.summary).not.toContain("Lido");
    expect(emitted[0]).toMatchObject({
      action: { detail: "Tudo é rio · hoje está como “Lido”" },
    });
  });

  it("saves the data sharing choice and the route follows it", async () => {
    expect(
      (await testDb.user.findUniqueOrThrow({ where: { id: USER } }))
        .assistantShareData,
    ).toBe(false);
    expect(await setAssistantDataSharing(true)).toMatchObject({ ok: true });
    expect(
      (await testDb.user.findUniqueOrThrow({ where: { id: USER } }))
        .assistantShareData,
    ).toBe(true);
    const { POST } = await import("@/app/api/assistant/route");
    openai.rounds = [textRound("Oi")];
    await (
      await POST(
        new Request("http://localhost/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "oi" }),
        }),
      )
    ).text();
    expect(openai.bodies[0].instructions).toContain("Leitora Teste");
    await setAssistantDataSharing(false);
    expect(
      (await testDb.user.findUniqueOrThrow({ where: { id: USER } }))
        .assistantShareData,
    ).toBe(false);
  });

  it("discovers catalog books by page count and subject", async () => {
    await testDb.book.createMany({
      data: [
        {
          id: "book-long",
          title: "Calhamaço",
          authors: ["Autora Longa"],
          pageCount: 900,
          categories: ["Fantasia"],
        },
        {
          id: "book-poem",
          title: "Versos",
          authors: ["Poeta"],
          pageCount: 90,
          categories: ["Poesia"],
        },
      ],
    });
    const ctx = { userId: USER, shareData: false, emit: () => {} };
    const short = (await runTool(
      "discover_books",
      { max_pages: 250, min_pages: null, language: null, subject: null },
      ctx,
    )) as { books: { id: string }[] };
    expect(short.books.map((b) => b.id).sort()).toEqual([
      "book-1",
      "book-poem",
    ]);
    const poems = (await runTool(
      "discover_books",
      { max_pages: null, min_pages: null, language: null, subject: "poesia" },
      ctx,
    )) as { books: { id: string }[] };
    expect(poems.books.map((b) => b.id)).toEqual(["book-poem"]);
  });

  it("searches the catalog and marks what is already on the shelf", async () => {
    await testDb.userBook.create({
      data: { userId: USER, bookId: "book-1", status: "READ" },
    });
    const result = (await runTool(
      "search_books",
      { query: "tudo é rio" },
      {
        userId: USER,
        shareData: true,
        emit: () => {},
      },
    )) as { results: { id: string; my_status: string | null }[] };
    expect(result.results[0]).toMatchObject({
      id: "book-1",
      my_status: "READ",
    });
  });

  it("reports OpenAI failures without saving an empty answer", async () => {
    openai.fail = new Error("boom");
    const { events, result } = await run("Oi");
    expect(events.at(-1)).toMatchObject({ type: "error" });
    expect(result.saved).toBe(false);
    expect(
      await testDb.assistantMessage.count({
        where: { threadId: result.threadId },
      }),
    ).toBe(1);
  });

  it("caps messages per day", async () => {
    const day = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
    await testDb.assistantUsage.create({
      data: { userId: USER, day, messages: 39 },
    });
    expect(await consumeDailyMessage(USER)).toBe(0);
    await expect(consumeDailyMessage(USER)).rejects.toBeInstanceOf(
      AssistantRequestError,
    );
  });

  it("includes conversations in the data export", async () => {
    openai.rounds = [textRound("Oi, leitora")];
    await run("Oi");
    const { GET } = await import("@/app/api/me/export/route");
    const data = await (await GET()).json();
    expect(data.assistant.conversations[0]).toMatchObject({
      title: "Oi",
      messages: [
        { from: "you", text: "Oi" },
        { from: "assistant", text: "Oi, leitora" },
      ],
    });
  });

  it("deletes every conversation", async () => {
    openai.rounds = [textRound("Oi")];
    await run("Oi");
    expect((await deleteAllAssistantThreads()).ok).toBe(true);
    expect(await testDb.assistantThread.count()).toBe(0);
  });
});

describe("assistant route", () => {
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    POST(
      new Request("http://localhost/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
      }),
    );

  it("rejects bad requests", async () => {
    expect((await post({ message: "   " })).status).toBe(400);
    expect((await post({ message: "x".repeat(2001) })).status).toBe(400);
    expect((await post({ message: "oi", threadId: "nope" })).status).toBe(404);
    expect(
      (await post({ message: "oi" }, { origin: "https://evil.example" }))
        .status,
    ).toBe(403);
    viewer.id = null;
    expect((await post({ message: "oi" })).status).toBe(401);
    viewer.id = USER;
    delete process.env.OPENAI_API_KEY;
    expect((await post({ message: "oi" })).status).toBe(503);
  });

  it("streams NDJSON events", async () => {
    openai.rounds = [textRound("Olá, leitora.")];
    const res = await post({ message: "oi" });
    expect(res.headers.get("content-type")).toContain("application/x-ndjson");
    const events = (await res.text())
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l) as StreamEvent);
    expect(events[0].type).toBe("thread");
    expect(events.at(-1)).toMatchObject({ type: "done", remaining: 39 });
  });

  it("returns 429 when the day is used up", async () => {
    const day = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
    await testDb.assistantUsage.create({
      data: { userId: USER, day, messages: 40 },
    });
    const res = await post({ message: "oi" });
    expect(res.status).toBe(429);
    expect((await res.json()).error).toContain("40 mensagens");
  });
});
