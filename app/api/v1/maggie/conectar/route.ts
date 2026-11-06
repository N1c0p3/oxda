import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_SESION, leerSesion } from "@/lib/auth/sesion";
import { MAGGIE } from "@/lib/maggie/identidad";
import { getProfile, type ProfileId } from "@/lib/profiles";
import { codigoParaPerfil, cuentasDePerfil } from "@/lib/telegram/store";

export const dynamic = "force-dynamic";

// El perfil sale siempre de la sesión firmada, nunca del cuerpo de la petición.
function perfilDeSesion(request: NextRequest) {
  const sesion = leerSesion(request.cookies.get(COOKIE_SESION)?.value);
  return getProfile((sesion?.perfil ?? null) as ProfileId | null);
}

export async function GET(request: NextRequest) {
  const perfil = perfilDeSesion(request);
  if (!perfil) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
  return NextResponse.json({ cuentas: await cuentasDePerfil(perfil.id) });
}

export async function POST(request: NextRequest) {
  const perfil = perfilDeSesion(request);
  if (!perfil) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
  const codigo = await codigoParaPerfil(perfil.name, perfil.id);
  return NextResponse.json({ enlace: `${MAGGIE.enlaceTelegram}?start=${codigo}` });
}
