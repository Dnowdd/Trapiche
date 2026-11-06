import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = [
  "/auth",
  "/api/auth",
  "/api/cron",
  "/api/avatars/",
  "/api/v1/",
  "/api/email/",
  "/api/books/isbn/",
];
const PUBLIC_EXACT = [
  "/",
  "/termos",
  "/privacidade",
  "/search",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
  "/emails/cancelado",
  "/api/books",
  "/api/books/search",
];
const IMAGE = "(?:\\/(?:opengraph|twitter)-image[^/]*)?";
const PUBLIC_PATTERNS = [
  `^(?:\\/(?:opengraph|twitter)-image[^/]*|\\/(?:icon|apple-icon)[^/]*)$`,
  `^\\/book\\/[^/]+(?:\\/resenhas|\\/citacoes)?${IMAGE}$`,
  `^\\/lists\\/[^/]+${IMAGE}$`,
  `^\\/u\\/[^/]+(?:\\/retrospectiva)?${IMAGE}$`,
  `^\\/author\\/[^/]+${IMAGE}$`,
  `^\\/publisher\\/[^/]+${IMAGE}$`,
  `^\\/serie\\/[^/]+${IMAGE}$`,
  `^\\/citacao\\/[^/]+${IMAGE}$`,
].map((source) => new RegExp(source));

function isPublic(pathname: string) {
  return (
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    PUBLIC_PATTERNS.some((re) => re.test(pathname))
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!getSessionCookie(request) && !isPublic(pathname)) {
    const url = new URL("/auth", request.url);
    if (!pathname.startsWith("/api/"))
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
