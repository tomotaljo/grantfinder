import { NextRequest, NextResponse } from "next/server";

const COOKIE = "admin_session";

function makeToken(password: string): string {
  return btoa(`${password}:benefitsfinder-admin-v1`);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let the login page through unconditionally
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  const expected = makeToken(process.env.ADMIN_PASSWORD ?? "");

  if (token !== expected) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
