import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_SESION, leerSesion } from "@/lib/auth/sesion";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const sesion = leerSesion(request.cookies.get(COOKIE_SESION)?.value);
  if (!sesion) return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
  return NextResponse.json({ perfil: sesion.perfil });
}
