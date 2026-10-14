import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = ["/auth", "/api/auth"];
const PUBLIC_EXACT = ["/", "/api/books"];

function isPublic(pathname: string) {
  return (
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!getSessionCookie(request) && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
