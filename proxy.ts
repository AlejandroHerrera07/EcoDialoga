// ─────────────────────────────────────────────
// Next.js Proxy — Route Protection
// ─────────────────────────────────────────────
// Protege rutas /student/* y /teacher/*.
// Redirige a /login si no hay token.
//
// NOTA: Este proxy lee la cookie/header en
// el edge. En modo mock, solo verifica la
// presencia del token en cookie. Cuando el
// backend esté listo, puedes validar el JWT
// aquí o en el backend.
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/", "/api"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Allow static assets & Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for auth token
  // En modo mock el token se guarda en localStorage (client-side),
  // así que este middleware solo aplica plenamente cuando el backend
  // setee una cookie httpOnly. Mientras tanto, la protección real
  // ocurre client-side en el AuthProvider.
  const token =
    request.cookies.get("eco_token")?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*"],
};
