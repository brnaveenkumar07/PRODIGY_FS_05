import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/edge-session";

// Routes that require authentication
const protectedRoutes = ["/settings", "/notifications"];
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protect private routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
