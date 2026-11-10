import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PRIVATE_PREFIXES = [
  "/admin",
  "/assistente",
  "/desenvolvedores",
  "/importar",
  "/notificacoes",
  "/suporte",
  "/profile",
  "/api/assistant",
  "/api/me",
  "/api/support",
];

function isPrivate(pathname: string) {
  return PRIVATE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPrivate(pathname) && !getSessionCookie(request)) {
    if (pathname.startsWith("/api/"))
      return NextResponse.json(
        { error: "Entre na sua conta." },
        { status: 401 },
      );
    const url = new URL("/auth", request.url);
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/assistente/:path*",
    "/desenvolvedores/:path*",
    "/importar/:path*",
    "/notificacoes/:path*",
    "/suporte/:path*",
    "/profile/:path*",
    "/api/assistant/:path*",
    "/api/me/:path*",
    "/api/support/:path*",
  ],
};
