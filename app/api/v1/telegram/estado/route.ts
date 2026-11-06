import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";

import { adminClient } from "@/lib/supabase/api";
import { rechazarSiNoEsAdmin } from "@/lib/telegram/admin";
import { MODELO } from "@/lib/telegram/agente";
import { activarWebhook, obtenerBot, obtenerWebhook, publicarIdentidad } from "@/lib/telegram/bot-api";
import { MODELO_VOZ } from "@/lib/telegram/voz";

export const dynamic = "force-dynamic";

function mensajeDe(error: unknown) {
  return error instanceof Error ? error.message : "Error desconocido";
}

async function revisarClaude() {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, detalle: "Falta ANTHROPIC_API_KEY" };
  try {
    const modelo = await new Anthropic({ timeout: 10_000, maxRetries: 0 }).models.retrieve(MODELO);
    return { ok: true, detalle: modelo.display_name };
  } catch (error) {
    return { ok: false, detalle: mensajeDe(error) };
  }
}

async function revisarVoz() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, detalle: "Falta OPENAI_API_KEY" };
  try {
    const response = await fetch(`${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/models/${MODELO_VOZ}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok ? { ok: true, detalle: MODELO_VOZ } : { ok: false, detalle: `OpenAI respondió ${response.status}` };
  } catch (error) {
    return { ok: false, detalle: mensajeDe(error) };
  }
}

async function leerAvatar(origin: string) {
  try {
    const response = await fetch(`${origin}/maggie/avatar-telegram.jpg`, { signal: AbortSignal.timeout(10_000) });
    return response.ok ? new Uint8Array(await response.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

async function revisarBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) return { ok: false, detalle: "Falta TELEGRAM_BOT_TOKEN", webhook: null };
  try {
    const [bot, webhook] = await Promise.all([obtenerBot(), obtenerWebhook()]);
    return { ok: true, detalle: `@${bot.username}`, webhook };
  } catch (error) {
    return { ok: false, detalle: mensajeDe(error), webhook: null };
  }
}

async function revisarTablas() {
  const { error } = await adminClient().from("telegram_vinculos").select("id", { head: true, count: "exact" });
  if (!error) return { ok: true, detalle: "Migración 021 aplicada" };
  return { ok: false, detalle: `Falta ejecutar database/migrations/021_telegram_agente.sql (${error.message})` };
}

export async function GET(request: NextRequest) {
  const rechazo = rechazarSiNoEsAdmin(request);
  if (rechazo) return rechazo;

  const [claude, voz, bot, tablas] = await Promise.all([revisarClaude(), revisarVoz(), revisarBot(), revisarTablas()]);
  const esperado = `${request.nextUrl.origin}/api/telegram/webhook`;
  const url = bot.webhook?.url ?? "";
  return NextResponse.json({
    claude,
    voz,
    bot: { ok: bot.ok, detalle: bot.detalle },
    tablas,
    secreto: {
      ok: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
      detalle: process.env.TELEGRAM_WEBHOOK_SECRET ? "Configurado" : "Falta TELEGRAM_WEBHOOK_SECRET",
    },
    webhook: {
      ok: url === esperado && !bot.webhook?.last_error_message,
      detalle: bot.webhook?.last_error_message ?? (url || "Sin activar"),
    },
  });
}

/** Registra este despliegue como destino de los mensajes del bot. */
export async function POST(request: NextRequest) {
  const rechazo = rechazarSiNoEsAdmin(request);
  if (rechazo) return rechazo;

  const secreto = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secreto) return NextResponse.json({ error: "Falta TELEGRAM_WEBHOOK_SECRET" }, { status: 503 });
  const { origin, protocol } = request.nextUrl;
  if (protocol !== "https:") {
    return NextResponse.json(
      { error: "Telegram solo entrega mensajes por https. Abre este panel desde el sitio publicado." },
      { status: 400 },
    );
  }
  try {
    await activarWebhook(`${origin}/api/telegram/webhook`, secreto);
    const avisos = await publicarIdentidad(await leerAvatar(origin));
    return NextResponse.json({ ok: true, avisos });
  } catch (error) {
    return NextResponse.json({ error: mensajeDe(error) }, { status: 502 });
  }
}
