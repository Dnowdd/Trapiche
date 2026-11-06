export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "code"; text: string }
  | { type: "link"; href: string; children: Inline[] };

export type Line = Inline[];

export type MdBlock =
  | { type: "p"; lines: Line[] }
  | { type: "h"; line: Line }
  | { type: "quote"; lines: Line[] }
  | { type: "ul"; items: Line[][] }
  | { type: "ol"; start: number; items: Line[][] };

const WORD = /[\p{L}\p{N}]/u;
const LINK = /^\[([^\]\n]+)\]\(([^)\s]+)\)/;

export function safeHref(href: string) {
  return /^\/(?!\/)[^\s]*$/.test(href) ? href : null;
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push({ type: "text", text: buf });
    buf = "";
  };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "*" && src[i + 1] === "*") {
      const end = src.indexOf("**", i + 2);
      if (end > i + 2) {
        flush();
        out.push({
          type: "strong",
          children: parseInline(src.slice(i + 2, end)),
        });
        i = end + 2;
        continue;
      }
    }
    if (ch === "[") {
      const m = LINK.exec(src.slice(i));
      if (m) {
        flush();
        const children = parseInline(m[1]);
        const href = safeHref(m[2]);
        if (href) out.push({ type: "link", href, children });
        else out.push(...children);
        i += m[0].length;
        continue;
      }
    }
    if (
      (ch === "*" || ch === "_") &&
      src[i + 1] &&
      src[i + 1] !== " " &&
      src[i + 1] !== ch &&
      !WORD.test(src[i - 1] ?? " ")
    ) {
      let end = src.indexOf(ch, i + 1);
      while (
        end > -1 &&
        (src[end - 1] === " " || WORD.test(src[end + 1] ?? " "))
      )
        end = src.indexOf(ch, end + 1);
      if (end > i + 1) {
        flush();
        out.push({ type: "em", children: parseInline(src.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    if (ch === "`") {
      const end = src.indexOf("`", i + 1);
      if (end > i + 1) {
        flush();
        out.push({ type: "code", text: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

export function parseMarkdown(src: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  let para: string[] = [];
  let blank = false;
  const flush = () => {
    if (para.length) blocks.push({ type: "p", lines: para.map(parseInline) });
    para = [];
  };

  for (const raw of src.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      blank = true;
      continue;
    }
    let m: RegExpExecArray | null;

    if ((m = /^\s*[-*•]\s+(.*)$/.exec(line))) {
      flush();
      const last = blocks.at(-1);
      if (last?.type === "ul") last.items.push([parseInline(m[1])]);
      else blocks.push({ type: "ul", items: [[parseInline(m[1])]] });
    } else if ((m = /^\s*(\d{1,3})[.)]\s+(.*)$/.exec(line))) {
      flush();
      const last = blocks.at(-1);
      if (last?.type === "ol") last.items.push([parseInline(m[2])]);
      else
        blocks.push({
          type: "ol",
          start: Number(m[1]),
          items: [[parseInline(m[2])]],
        });
    } else if ((m = /^#{1,6}\s+(.*)$/.exec(line))) {
      flush();
      blocks.push({ type: "h", line: parseInline(m[1]) });
    } else if ((m = /^>\s?(.*)$/.exec(line))) {
      flush();
      const last = blocks.at(-1);
      if (last?.type === "quote" && !blank) last.lines.push(parseInline(m[1]));
      else blocks.push({ type: "quote", lines: [parseInline(m[1])] });
    } else {
      const last = blocks.at(-1);
      if (
        !para.length &&
        !blank &&
        (last?.type === "ul" || last?.type === "ol") &&
        /^\s{2,}\S/.test(raw)
      )
        last.items.at(-1)!.push(parseInline(line.trim()));
      else para.push(line.trim());
    }
    blank = false;
  }
  flush();
  return blocks;
}

export function plainText(src: string): string {
  const walk = (nodes: Inline[]): string =>
    nodes
      .map((n) =>
        n.type === "text" || n.type === "code" ? n.text : walk(n.children),
      )
      .join("");
  return parseMarkdown(src)
    .map((b) => {
      if (b.type === "p" || b.type === "quote")
        return b.lines.map(walk).join("\n");
      if (b.type === "h") return walk(b.line);
      return b.items
        .map(
          (item, i) =>
            `${b.type === "ol" ? `${b.start + i}.` : "-"} ${item.map(walk).join("\n  ")}`,
        )
        .join("\n");
    })
    .join("\n\n");
}
