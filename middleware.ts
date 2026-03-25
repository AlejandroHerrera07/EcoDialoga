import { NextRequest, NextResponse } from "next/server";

// Rutas protegidas
const PROTECTED_ROUTES = {
  teacher: ["/teacher"],
  student: ["/student"],
};

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = ["/login", "/"];

/**
 * Verifica si una ruta está protegida
 */
function isProtectedRoute(pathname: string): boolean {
  return Object.values(PROTECTED_ROUTES).some((routes) =>
    routes.some((route) => pathname.startsWith(route))
  );
}

/**
 * Verifica si una ruta es pública
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route));
}

/**
 * Obtiene el rol requerido para una ruta
 */
function getRequiredRole(pathname: string): "student" | "teacher" | null {
  if (pathname.startsWith("/teacher")) return "teacher";
  if (pathname.startsWith("/student")) return "student";
  return null;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Permitir rutas estáticas y API sin validación
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Rutas públicas - no requieren autenticación
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Rutas protegidas - validar que exista token
  // La validación del rol se hace en el layout/componente del lado del cliente
  if (isProtectedRoute(pathname)) {
    const token = request.cookies.get("eco_token")?.value;

    if (!token) {
      // No hay token - redirigir a login
      return NextResponse.redirect(
        new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
      );
    }

    // Token existe, permitir continuar
    // La validación del rol (student vs teacher) se hará en el componente client-side
    return NextResponse.next();
  }

  return NextResponse.next();
}

/**
 * Configurar qué rutas ejecutan el middleware
 */
export const config = {
  matcher: [
    /*
     * Validar todas las rutas excepto:
     * - api/: rutas API
     * - _next/static/: archivos estáticos
     * - _next/image/: optimización de imágenes
     * - favicon.ico: favicon
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
