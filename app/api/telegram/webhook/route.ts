import { after, NextResponse, type NextRequest } from "next/server";

import { secretosIguales } from "@/lib/telegram/admin";
import { procesarUpdate, type UpdateTelegram } from "@/lib/telegram/procesar";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const secreto = request.headers.get("x-telegram-bot-api-secret-token");
  if (!secretosIguales(secreto, process.env.TELEGRAM_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const update = (await request.json()) as UpdateTelegram;
  // Se responde de inmediato: si Telegram espera demasiado, reintenta la entrega.
  after(async () => {
    try {
      await procesarUpdate(update);
    } catch (error) {
      console.error("[telegram] no se pudo procesar el update", update.update_id, error);
    }
  });
  return NextResponse.json({ ok: true });
}
