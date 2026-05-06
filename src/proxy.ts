import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/config";

const PROTECTED_PATHS = [
  "/submit",
  "/admin",
  "/feedback/",
  "/feedbacks",
  "/dev",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasCookie = Boolean(request.cookies.get(COOKIE_NAME)?.value);
  if (hasCookie) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/submit",
    "/admin/:path*",
    "/feedback/:path*",
    "/feedbacks",
    "/dev/:path*",
  ],
};
