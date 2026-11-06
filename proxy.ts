import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PRIVATE_PREFIXES = [
  "/admin",
  "/desenvolvedores",
  "/importar",
  "/notificacoes",
  "/suporte",
  "/profile",
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
