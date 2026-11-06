import { NextRequest, NextResponse } from "next/server";
import { smartSearch } from "@/lib/google-books";
import { clientIp, rateLimited } from "@/lib/rate-limit";

const validIsbn = (s: string) => {
  const d = s.replace(/[^0-9X]/gi, "").toUpperCase();
  if (d.length === 13 && /^97[89]\d{10}$/.test(d)) {
    const sum = [...d.slice(0, 12)].reduce(
      (a, c, i) => a + Number(c) * (i % 2 ? 3 : 1),
      0,
    );
    return (10 - (sum % 10)) % 10 === Number(d[12]) ? d : null;
  }
  return d.length === 10 ? d : null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ isbn: string }> },
) {
  const isbn = validIsbn((await params).isbn);
  if (!isbn)
    return NextResponse.json({ error: "ISBN inválido." }, { status: 400 });
  if (await rateLimited(`isbn:${clientIp(req.headers)}`, 30, 60_000))
    return NextResponse.json(
      { error: "Muitas buscas seguidas. Espere um pouco." },
      { status: 429 },
    );
  const { works, google } = await smartSearch(isbn, 3);
  const id = works[0]?.main.id ?? google[0]?.id ?? null;
  return NextResponse.json({ isbn, id });
}
