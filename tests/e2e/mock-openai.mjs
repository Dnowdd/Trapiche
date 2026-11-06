import http from "node:http";

const PORT = Number(process.env.MOCK_OPENAI_PORT ?? 4010);
let seq = 0;
const id = (prefix) => `${prefix}_${Date.now().toString(36)}${++seq}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function lastUserText(input) {
  for (let i = input.length - 1; i >= 0; i--) {
    const item = input[i];
    if (item.role !== "user") continue;
    if (typeof item.content === "string") return item.content;
    return (item.content ?? []).map((c) => c.text ?? "").join(" ");
  }
  return "";
}

function plan(body) {
  const input = body.input ?? [];
  const last = input.at(-1);
  if (last?.type === "function_call_output") {
    const call = input.find(
      (i) => i.type === "function_call" && i.call_id === last.call_id,
    );
    const output = JSON.parse(last.output ?? "{}");
    if (call?.name === "get_my_shelf") {
      const first = output.books?.[0];
      if (first)
        return {
          call: "show_books",
          args: { book_ids: [first.id], title: "Da sua estante" },
        };
      return {
        text: "Sua estante ainda está vazia. Que tal começar por um clássico?",
      };
    }
    if (call?.name === "show_books")
      return {
        text: "Esse é o que está na sua estante agora. **Boa leitura!**\n\nQuer que eu sugira o próximo?",
      };
    if (call?.name?.startsWith("propose_"))
      return { text: "Deixei pronto para você confirmar." };
    return { text: "Pronto." };
  }
  const text = lastUserText(input).toLowerCase();
  const bookId = /\(id ([\w-]+)\)/.exec(body.instructions ?? "")?.[1];
  if (/quero ler|pilha/.test(text) && bookId)
    return {
      call: "propose_shelf_status",
      args: { book_id: bookId, status: "WANT" },
    };
  const shared = (body.tools ?? []).some((t) => t.name === "get_my_shelf");
  if (/estante/.test(text) && !shared)
    return {
      text: "Para eu ver a sua estante, marque “Usar os dados da minha conta” logo abaixo da caixa de mensagem.",
    };
  if (/estante/.test(text))
    return {
      call: "get_my_shelf",
      args: { status: null, query: null, limit: 10 },
    };
  if (/simule um erro/.test(text)) return { fail: true };
  return {
    text: "Oi! Sou o Prático em modo de teste. Posso olhar a sua **estante**, sugerir leituras e deixar mudanças prontas para você confirmar.\n\n- Pergunte sobre a sua estante\n- Peça uma recomendação",
  };
}

function response(model, output, status = "completed") {
  return {
    id: id("resp"),
    object: "response",
    created_at: Math.floor(Date.now() / 1000),
    status,
    model,
    output,
    error: null,
    incomplete_details: null,
    usage: {
      input_tokens: 1200,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: 80,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 1280,
    },
  };
}

async function stream(res, body) {
  const step = plan(body);
  if (step.fail) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: { message: "mock failure", type: "server_error" },
      }),
    );
    return;
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  let n = 0;
  const send = (event) =>
    res.write(
      `event: ${event.type}\ndata: ${JSON.stringify({ ...event, sequence_number: n++ })}\n\n`,
    );
  const model = body.model;
  send({
    type: "response.created",
    response: response(model, [], "in_progress"),
  });

  if (step.call) {
    const item = {
      type: "function_call",
      id: id("fc"),
      call_id: id("call"),
      name: step.call,
      arguments: JSON.stringify(step.args),
      status: "completed",
    };
    send({
      type: "response.output_item.added",
      output_index: 0,
      item: { ...item, arguments: "", status: "in_progress" },
    });
    await sleep(120);
    send({
      type: "response.function_call_arguments.done",
      output_index: 0,
      item_id: item.id,
      arguments: item.arguments,
    });
    send({ type: "response.output_item.done", output_index: 0, item });
    send({ type: "response.completed", response: response(model, [item]) });
    res.end();
    return;
  }

  const msgId = id("msg");
  send({
    type: "response.output_item.added",
    output_index: 0,
    item: {
      type: "message",
      id: msgId,
      status: "in_progress",
      role: "assistant",
      content: [],
    },
  });
  const parts = step.text.match(/\S+\s*/g) ?? [];
  for (const part of parts) {
    send({
      type: "response.output_text.delta",
      item_id: msgId,
      output_index: 0,
      content_index: 0,
      delta: part,
      logprobs: [],
    });
    await sleep(18);
  }
  const message = {
    type: "message",
    id: msgId,
    status: "completed",
    role: "assistant",
    content: [{ type: "output_text", text: step.text, annotations: [] }],
  };
  send({ type: "response.output_item.done", output_index: 0, item: message });
  send({ type: "response.completed", response: response(model, [message]) });
  res.end();
}

http
  .createServer((req, res) => {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      if (!req.url?.endsWith("/responses")) {
        res.writeHead(404);
        res.end();
        return;
      }
      stream(res, JSON.parse(raw || "{}")).catch(() => res.end());
    });
  })
  .listen(PORT, "127.0.0.1", () => {
    console.log(`mock openai on http://127.0.0.1:${PORT}`);
  });
