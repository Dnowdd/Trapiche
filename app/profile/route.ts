import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const url = request.nextUrl.clone();
  const handle = session?.user.handle;
  url.pathname = handle ? `/u/${handle}` : "/auth";
  if (!handle) url.search = "";
  return NextResponse.redirect(url);
}
