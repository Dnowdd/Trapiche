import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUnsubscribe, type EmailKind } from "@/lib/unsubscribe";

const FIELD: Record<EmailKind, "monthlyDigest" | "inactivityReminder"> = {
  digest: "monthlyDigest",
  reminder: "inactivityReminder",
};

async function unsubscribe(params: URLSearchParams) {
  const target = verifyUnsubscribe(params);
  if (!target) return null;
  await db.user.updateMany({
    where: { id: target.userId },
    data: { [FIELD[target.kind]]: false },
  });
  return target.kind;
}

export async function GET(req: NextRequest) {
  const kind = await unsubscribe(req.nextUrl.searchParams);
  const url = new URL("/emails/cancelado", req.url);
  url.searchParams.set("tipo", kind ?? "invalido");
  return NextResponse.redirect(url);
}

export async function POST(req: NextRequest) {
  const kind = await unsubscribe(req.nextUrl.searchParams);
  return NextResponse.json({ ok: kind != null }, { status: kind ? 200 : 400 });
}
