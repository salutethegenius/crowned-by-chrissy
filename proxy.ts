import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "cbc_owner";

function secret() {
  return new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-not-for-production");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/owner/login") return NextResponse.next();
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    const login = new URL("/owner/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  try {
    await jwtVerify(token, secret());
    return NextResponse.next();
  } catch {
    const login = new URL("/owner/login", request.url);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: ["/owner/:path*", "/api/owner/:path*"],
};
