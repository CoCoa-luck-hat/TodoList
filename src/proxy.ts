import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth();

  const { pathname } = request.nextUrl;

  // Allow auth routes, static files, and join pages
  const publicPaths = ["/login", "/api/auth", "/join"];
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".");

  if (isStaticAsset) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from login page
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect unauthenticated users to login
  if (!session && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
