import { NextResponse, type NextRequest } from "next/server";

import { getProfile, type ProfileId } from "@/lib/profiles";
import { rechazarSiNoEsAdmin } from "@/lib/telegram/admin";
import { obtenerBot } from "@/lib/telegram/bot-api";
import { crearVinculo, listarAcciones, listarVinculos } from "@/lib/telegram/store";

export const dynamic = "force-dynamic";

function mensajeDe(error: unknown) {
  return error instanceof Error ? error.message : "Error desconocido";
}

export async function GET(request: NextRequest) {
  const rechazo = rechazarSiNoEsAdmin(request);
  if (rechazo) return rechazo;
  try {
    const [vinculos, acciones] = await Promise.all([listarVinculos(), listarAcciones()]);
    return NextResponse.json({ vinculos, acciones });
  } catch (error) {
    return NextResponse.json({ error: mensajeDe(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rechazo = rechazarSiNoEsAdmin(request);
  if (rechazo) return rechazo;

  const payload = (await request.json()) as { nombre?: string; perfil?: string };
  const nombre = payload.nombre?.trim();
  if (!nombre || !getProfile((payload.perfil ?? null) as ProfileId | null)) {
    return NextResponse.json({ error: "Indica nombre y perfil" }, { status: 400 });
  }
  try {
    const bot = await obtenerBot();
    const { vinculo, codigo } = await crearVinculo(nombre, payload.perfil as ProfileId);
    return NextResponse.json({ vinculo, enlace: `https://t.me/${bot.username}?start=${codigo}` }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: mensajeDe(error) }, { status: 500 });
  }
}
