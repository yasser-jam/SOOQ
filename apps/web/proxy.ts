import { NextRequest, NextResponse } from "next/server";

// ==============================
// Public Routes (no auth needed)
// ==============================
const PUBLIC_ROUTES = ["/login", "/verify-otp", "/request-otp", "/_next", "/favicon.ico"];

// ==============================
// Middleware
// ==============================
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

    // return NextResponse.next();
  if (isPublic) {
    return NextResponse.next();
  }

  // Check token from cookies
  const token = request.cookies.get("sooq-access-token")?.value;

  if (!token) {
    const loginUrl = new URL("/request-otp", request.url);

    // Optional: redirect back after login
    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// ==============================
// Matcher (apply middleware)
// ==============================
export const config = {
  matcher: [
    /*
     * Apply to all routes except:
     * - API routes
     * - static files
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};