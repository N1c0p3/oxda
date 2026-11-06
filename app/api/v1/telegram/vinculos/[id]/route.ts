import { NextResponse, type NextRequest } from "next/server";

import { getProfile, type ProfileId } from "@/lib/profiles";
import { rechazarSiNoEsAdmin } from "@/lib/telegram/admin";
import { obtenerBot } from "@/lib/telegram/bot-api";
import { actualizarVinculo, eliminarVinculo, regenerarVinculo } from "@/lib/telegram/store";

export const dynamic = "force-dynamic";

function mensajeDe(error: unknown) {
  return error instanceof Error ? error.message : "Error desconocido";
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const rechazo = rechazarSiNoEsAdmin(request);
  if (rechazo) return rechazo;

  const id = Number((await context.params).id);
  const payload = (await request.json()) as { activo?: boolean; perfil?: string; regenerar?: boolean };
  try {
    if (payload.regenerar) {
      const bot = await obtenerBot();
      const { vinculo, codigo } = await regenerarVinculo(id);
      return NextResponse.json({ vinculo, enlace: `https://t.me/${bot.username}?start=${codigo}` });
    }
    if (payload.perfil !== undefined && !getProfile(payload.perfil as ProfileId)) {
      return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
    }
    const vinculo = await actualizarVinculo(id, {
      activo: payload.activo,
      perfil: payload.perfil as ProfileId | undefined,
    });
    return NextResponse.json({ vinculo });
  } catch (error) {
    return NextResponse.json({ error: mensajeDe(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const rechazo = rechazarSiNoEsAdmin(request);
  if (rechazo) return rechazo;
  try {
    await eliminarVinculo(Number((await context.params).id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: mensajeDe(error) }, { status: 500 });
  }
}
