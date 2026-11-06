import { describe, expect, it } from "vitest";
import {
  parseInline,
  parseMarkdown,
  plainText,
  safeHref,
} from "@/lib/assistant/markdown";
import {
  ACCOUNT_TOOLS,
  TOOLS,
  TOOL_STATUS,
  toolsFor,
} from "@/lib/assistant/tool-defs";

describe("assistant markdown", () => {
  it("parses bold, italic, code and internal links", () => {
    expect(
      parseInline(
        "Leia **Torto Arado**, de *Itamar*, em [sua estante](/u/ana).",
      ),
    ).toEqual([
      { type: "text", text: "Leia " },
      { type: "strong", children: [{ type: "text", text: "Torto Arado" }] },
      { type: "text", text: ", de " },
      { type: "em", children: [{ type: "text", text: "Itamar" }] },
      { type: "text", text: ", em " },
      {
        type: "link",
        href: "/u/ana",
        children: [{ type: "text", text: "sua estante" }],
      },
      { type: "text", text: "." },
    ]);
    expect(parseInline("use `id`")).toEqual([
      { type: "text", text: "use " },
      { type: "code", text: "id" },
    ]);
  });

  it("drops external and protocol-relative links but keeps the label", () => {
    expect(parseInline("[loja](https://evil.example)")).toEqual([
      { type: "text", text: "loja" },
    ]);
    expect(parseInline("[x](//evil.example/a)")).toEqual([
      { type: "text", text: "x" },
    ]);
    expect(parseInline("[x](javascript:alert(1))")).toEqual([
      { type: "text", text: "x" },
      { type: "text", text: ")" },
    ]);
    expect(safeHref("/book/OL1M")).toBe("/book/OL1M");
    expect(safeHref("https://a.b")).toBeNull();
  });

  it("leaves stray markers and snake_case alone", () => {
    expect(parseInline("2 * 3 = 6 e meu_livro_favorito")).toEqual([
      { type: "text", text: "2 * 3 = 6 e meu_livro_favorito" },
    ]);
    expect(parseInline("**sem fim")).toEqual([
      { type: "text", text: "**sem fim" },
    ]);
  });

  it("groups paragraphs, lists, quotes and headings", () => {
    const blocks = parseMarkdown(
      [
        "### Para você",
        "Separei três:",
        "",
        "1. **Um**",
        "   curto e bom",
        "2. Dois",
        "",
        "3. Três",
        "",
        "- a",
        "* b",
        "",
        "> Viver é muito perigoso.",
        "> Guimarães",
      ].join("\n"),
    );
    expect(blocks.map((b) => b.type)).toEqual(["h", "p", "ol", "ul", "quote"]);
    const ol = blocks[2];
    expect(ol.type === "ol" && ol.items.length).toBe(3);
    expect(ol.type === "ol" && ol.items[0].length).toBe(2);
    const quote = blocks[4];
    expect(quote.type === "quote" && quote.lines.length).toBe(2);
  });

  it("keeps list order when a paragraph sits between items", () => {
    const blocks = parseMarkdown("- a\ntexto\n- b");
    expect(blocks.map((b) => b.type)).toEqual(["ul", "p", "ul"]);
  });

  it("starts ordered lists at the given number", () => {
    const [ol] = parseMarkdown("4. quatro\n5. cinco");
    expect(ol.type === "ol" && ol.start).toBe(4);
  });

  it("renders plain text for copying", () => {
    expect(plainText("**Oi**, [veja](/book/1)\n\n- um\n- dois")).toBe(
      "Oi, veja\n\n- um\n- dois",
    );
  });
});

describe("assistant tools", () => {
  const walk = (schema: Record<string, unknown>, path: string) => {
    const type = schema.type;
    const types = Array.isArray(type) ? type : [type];
    if (types.includes("null") && Array.isArray(schema.enum))
      expect(schema.enum, path).toContain(null);
    if (types.includes("object")) {
      const props = (schema.properties ?? {}) as Record<
        string,
        Record<string, unknown>
      >;
      expect(schema.additionalProperties, path).toBe(false);
      expect([...((schema.required as string[]) ?? [])].sort(), path).toEqual(
        Object.keys(props).sort(),
      );
      for (const [k, v] of Object.entries(props)) walk(v, `${path}.${k}`);
    }
    if (types.includes("array"))
      walk(schema.items as Record<string, unknown>, `${path}[]`);
  };

  it("uses strict schemas that OpenAI accepts", () => {
    const names = new Set<string>();
    for (const tool of TOOLS) {
      expect(tool.type).toBe("function");
      expect(tool.strict).toBe(true);
      expect(tool.name).toMatch(/^[a-z_]{3,64}$/);
      expect(names.has(tool.name)).toBe(false);
      names.add(tool.name);
      expect(tool.description?.length).toBeGreaterThan(20);
      walk(tool.parameters as Record<string, unknown>, tool.name);
    }
  });

  it("labels every read tool and keeps writes behind proposals", () => {
    for (const tool of TOOLS) {
      if (tool.name.startsWith("propose_")) continue;
      expect(TOOL_STATUS[tool.name], tool.name).toBeTruthy();
      expect(tool.name).toMatch(/^(get_|search_|show_)/);
    }
  });

  it("hides account tools when the reader does not share data", () => {
    const open = toolsFor(false).map((t) => t.name);
    for (const name of ACCOUNT_TOOLS) {
      expect(
        TOOLS.some((t) => t.name === name),
        name,
      ).toBe(true);
      expect(open).not.toContain(name);
    }
    expect(open).toContain("search_books");
    expect(toolsFor(true)).toHaveLength(TOOLS.length);
  });
});
