const FONT =
  "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif";
const MONO = "'JetBrains Mono',ui-monospace,Menlo,monospace";

const C = {
  page: "#eadfb0",
  card: "#fff8d5",
  dark: "#2b2710",
  ink: "#343600",
  ink2: "#433e12",
  ink3: "#66623d",
  ink4: "#7c7d58",
  yellow: "#ffe767",
  note: "#fcefae",
  noteBorder: "#f5dd5c",
  quote: "#f4e7a6",
  rule: "#ecdfa8",
};

const QUOTES = [
  [
    "Lia-os todos numa ânsia que era quase febre.",
    "Jorge Amado · Capitães da Areia",
  ],
  [
    "Escrevo porque à medida que escrevo vou me entendendo.",
    "Clarice Lispector",
  ],
  ["Viver é muito perigoso.", "Guimarães Rosa · Grande Sertão: Veredas"],
] as const;

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function appUrl(path = "") {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}${path}`;
}

export type Block =
  | { kind: "text"; html: string }
  | { kind: "button"; label: string; url: string; fallback?: boolean }
  | { kind: "note"; title: string; body?: string }
  | { kind: "quote"; text: string; by: string }
  | { kind: "divider" }
  | { kind: "small"; html: string };

export interface EmailContent {
  subject: string;
  preheader: string;
  eyebrow: string;
  title: string;
  blocks: Block[];
  quote?: boolean;
}

const p = (html: string, extra = "") =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:26px;color:${C.ink3};${extra}">${html}</p>`;

function block(b: Block) {
  switch (b.kind) {
    case "text":
      return p(b.html);
    case "small":
      return p(b.html, `font-size:13px;line-height:21px;color:${C.ink4};`);
    case "divider":
      return `<div style="height:1px;background:${C.rule};margin:28px 0;line-height:1px;font-size:1px">&nbsp;</div>`;
    case "button": {
      const url = escapeHtml(b.url);
      const fallback =
        b.fallback === false
          ? ""
          : `<div style="margin-top:20px;font-family:${MONO};font-size:10px;letter-spacing:1px;text-transform:uppercase;color:${C.ink4}">Ou copie e cole este link no navegador</div>
             <div style="margin-top:4px;font-family:${MONO};font-size:12px;line-height:18px;color:${C.ink2};word-break:break-all">${url}</div>`;
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 8px"><tr><td style="border-radius:12px;background:${C.yellow};box-shadow:0 10px 24px -14px rgba(67,62,18,0.6)">
        <a href="${url}" target="_blank" style="display:inline-block;padding:16px 36px;font-family:${FONT};font-size:15px;font-weight:700;color:${C.ink};text-decoration:none;border-radius:12px;border:1px solid ${C.noteBorder}">${escapeHtml(b.label)}&nbsp;&rarr;</a>
      </td></tr></table>${fallback}`;
    }
    case "note":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px;background:${C.note};border:1px solid ${C.noteBorder}"><tr>
        <td width="52" valign="top" style="padding:18px 0 18px 20px"><div style="width:32px;height:32px;border-radius:16px;background:${C.dark};color:${C.yellow};font-family:${FONT};font-size:15px;font-weight:800;line-height:32px;text-align:center">!</div></td>
        <td valign="top" style="padding:18px 20px 18px 12px;font-family:${FONT}"><div style="font-size:15px;font-weight:700;color:${C.ink2};line-height:22px">${b.title}</div>${b.body ? `<div style="font-size:13px;color:${C.ink3};line-height:20px">${b.body}</div>` : ""}</td>
      </tr></table>`;
    case "quote":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px"><tr><td style="border-left:3px solid ${C.noteBorder};padding:6px 0 6px 16px;font-family:${FONT};font-size:15px;line-height:24px;color:${C.ink2};white-space:pre-line">${b.text}<div style="margin-top:8px;font-family:${MONO};font-size:10px;letter-spacing:1px;text-transform:uppercase;color:${C.ink4}">${b.by}</div></td></tr></table>`;
  }
}

export function renderEmail(content: EmailContent) {
  const [quote, quoteBy] = QUOTES[content.subject.length % QUOTES.length];
  const year = new Date().getFullYear();
  const link = (href: string, label: string) =>
    `<a href="${appUrl(href)}" style="color:#d8cf9a;text-decoration:none">${label}</a>`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${escapeHtml(content.subject)}</title>
<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap");
body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%}
table{border-collapse:collapse!important}
a{text-decoration:none}
@media only screen and (max-width:620px){.container{width:100%!important}.px{padding-left:28px!important;padding-right:28px!important}.h1{font-size:30px!important;line-height:34px!important}}
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.page};font-family:${FONT}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};opacity:0">${escapeHtml(content.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.page}"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width:600px;max-width:600px;border-radius:24px;overflow:hidden">
<tr><td class="px" style="background:${C.dark};padding:26px 40px;border-radius:24px 24px 0 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="font-family:${FONT};font-size:24px;font-weight:800;letter-spacing:-0.5px;color:${C.card}"><a href="${appUrl("/")}" style="color:${C.card};text-decoration:none">Trapiche</a></td>
    <td align="right" style="font-family:${MONO};font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#a49c6a;line-height:14px">${content.eyebrow}</td>
  </tr></table>
</td></tr>
<tr><td class="px" style="background:${C.card};padding:44px 40px 36px">
  <h1 class="h1" style="margin:0 0 18px;font-family:${FONT};font-size:38px;line-height:42px;font-weight:800;letter-spacing:-1.2px;color:${C.ink}">${content.title}</h1>
  ${content.blocks.map(block).join("\n")}
</td></tr>
${
  content.quote === false
    ? ""
    : `<tr><td class="px" style="background:${C.quote};padding:34px 40px">
  <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:20px;line-height:28px;color:#5a5320">&ldquo;${quote}&rdquo;</div>
  <div style="margin-top:12px;font-family:${MONO};font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:${C.ink4}">${quoteBy}</div>
</td></tr>`
}
<tr><td class="px" style="background:${C.dark};padding:32px 40px;border-radius:0 0 24px 24px">
  <div style="font-family:${FONT};font-size:18px;font-weight:800;color:${C.card}">Trapiche</div>
  <div style="margin-top:6px;font-family:${FONT};font-size:13px;color:#b7ae7a">O porto seguro das suas leituras.</div>
  <div style="margin-top:22px;font-family:${MONO};font-size:10.5px;line-height:18px;color:#8a835a">Você recebeu este e-mail porque há uma conta Trapiche associada a este endereço.<br />${link("/suporte", "Suporte")} &nbsp;·&nbsp; ${link("/privacidade", "Privacidade")} &nbsp;·&nbsp; ${link("/termos", "Termos")}</div>
  <div style="margin-top:18px;font-family:${MONO};font-size:10px;color:#6b6440">&copy; ${year} Trapiche</div>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}

export function renderText(content: EmailContent) {
  const strip = (html: string) =>
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&ldquo;|&rdquo;/g, '"')
      .replace(/&rarr;/g, "→")
      .replace(/&middot;/g, "·");
  const lines = [strip(content.title), ""];
  for (const b of content.blocks) {
    if (b.kind === "text" || b.kind === "small") lines.push(strip(b.html), "");
    if (b.kind === "button") lines.push(`${b.label}: ${b.url}`, "");
    if (b.kind === "note")
      lines.push(strip(b.title) + (b.body ? ` ${strip(b.body)}` : ""), "");
    if (b.kind === "quote") lines.push(strip(b.text), `— ${strip(b.by)}`, "");
  }
  lines.push("—", "Trapiche · O porto seguro das suas leituras.", appUrl("/"));
  return lines.join("\n");
}
