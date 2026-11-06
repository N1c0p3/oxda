import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_SESION, leerSesion } from "@/lib/auth/sesion";
import { canAccessPath, getProfile, type AppProfile, type ProfileId } from "@/lib/profiles";

const RUTAS_PUBLICAS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/telegram/webhook"];

// Cada escritura exige acceso a la pantalla que la hace. Lo que no esté aquí se rechaza.
const ESCRITURAS: Array<{ prefijo: string; pantallas: string[] }> = [
  { prefijo: "/api/v1/comisiones", pantallas: ["/cuentas-por-pagar", "/logistica/prediccion"] },
  { prefijo: "/api/v1/crm", pantallas: ["/crm", "/pipeline"] },
  { prefijo: "/api/v1/inventarios/reporte", pantallas: ["/inventarios/reporte"] },
  { prefijo: "/api/v1/inventarios/movimientos", pantallas: ["/inventarios"] },
  { prefijo: "/api/v1/logistica", pantallas: ["/logistica"] },
  { prefijo: "/api/v1/maggie", pantallas: ["/maggie"] },
  { prefijo: "/api/v1/produccion", pantallas: ["/produccion"] },
  { prefijo: "/api/v1/productos", pantallas: ["/costeo"] },
  { prefijo: "/api/v1/ventas/pedidos", pantallas: ["/ventas"] },
  { prefijo: "/api/v1/telegram", pantallas: ["/telegram"] },
];

function puedeEscribir(perfil: AppProfile, pathname: string) {
  const regla = ESCRITURAS.find(({ prefijo }) => pathname === prefijo || pathname.startsWith(`${prefijo}/`));
  return regla?.pantallas.some((pantalla) => canAccessPath(perfil, pantalla)) ?? false;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sesion = leerSesion(request.cookies.get(COOKIE_SESION)?.value);
  const perfil = getProfile((sesion?.perfil ?? null) as ProfileId | null);

  if (pathname === "/login" && perfil) return NextResponse.redirect(new URL("/dashboard", request.url));
  if (RUTAS_PUBLICAS.includes(pathname)) return NextResponse.next();

  const esApi = pathname.startsWith("/api/");
  if (!perfil) {
    if (esApi) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (esApi) {
    const escribe = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    if (escribe && !puedeEscribir(perfil, pathname)) {
      return NextResponse.json({ error: "Tu perfil no permite esta acción" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/data/") || canAccessPath(perfil, pathname)) return NextResponse.next();
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

export const config = {
  // Lo demás en public/, como public/data, también pasa por aquí. Los archivos de
  // public/maggie quedan abiertos para que Telegram y la activación del bot los lean.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|maggie/).*)"],
};
