import { MAGGIE } from "@/lib/maggie/identidad";

const API_BASE = process.env.TELEGRAM_API_BASE || "https://api.telegram.org";
const MAX_MENSAJE = 4096;

export type BotonInline = { text: string; callback_data: string };

export class TelegramError extends Error {}

async function llamar<T>(metodo: string, cuerpo?: Record<string, unknown>): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new TelegramError("Falta TELEGRAM_BOT_TOKEN");
  const response = await fetch(`${API_BASE}/bot${token}/${metodo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo ?? {}),
  });
  const data = (await response.json()) as { ok: boolean; result: T; description?: string };
  if (!data.ok) throw new TelegramError(data.description ?? `Telegram rechazó ${metodo}`);
  return data.result;
}

/** Corta por saltos de línea para respetar el límite de Telegram sin partir renglones. */
export function dividirMensaje(texto: string, maximo = MAX_MENSAJE) {
  const partes: string[] = [];
  let resto = texto;
  while (resto.length > maximo) {
    const corte = resto.lastIndexOf("\n", maximo);
    const posicion = corte > maximo / 2 ? corte : maximo;
    partes.push(resto.slice(0, posicion));
    resto = resto.slice(posicion).trimStart();
  }
  if (resto) partes.push(resto);
  return partes;
}

export async function enviarMensaje(chatId: number, texto: string, botones?: BotonInline[][]) {
  const partes = dividirMensaje(texto);
  for (const [indice, parte] of partes.entries()) {
    const esUltima = indice === partes.length - 1;
    await llamar("sendMessage", {
      chat_id: chatId,
      text: parte,
      ...(esUltima && botones ? { reply_markup: { inline_keyboard: botones } } : {}),
    });
  }
}

export function editarMensaje(chatId: number, messageId: number, texto: string) {
  return llamar("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: texto.slice(0, MAX_MENSAJE),
  });
}

export function responderBoton(callbackId: string, texto?: string) {
  return llamar("answerCallbackQuery", { callback_query_id: callbackId, ...(texto ? { text: texto } : {}) });
}

export function indicarEscribiendo(chatId: number) {
  return llamar("sendChatAction", { chat_id: chatId, action: "typing" });
}

/** Descarga un archivo de un chat; `ruta` conserva la extensión que le dio Telegram. */
export async function descargarArchivo(fileId: string) {
  const { file_path: ruta } = await llamar<{ file_path?: string }>("getFile", { file_id: fileId });
  if (!ruta) throw new TelegramError("Telegram no entregó la ruta del archivo");
  const response = await fetch(`${API_BASE}/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${ruta}`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new TelegramError(`Telegram no entregó el archivo (${response.status})`);
  return { bytes: new Uint8Array(await response.arrayBuffer()), ruta };
}

export function obtenerBot() {
  return llamar<{ id: number; username: string; first_name: string }>("getMe");
}

export function obtenerWebhook() {
  return llamar<{ url: string; pending_update_count: number; last_error_message?: string }>("getWebhookInfo");
}

export async function activarWebhook(url: string, secreto: string) {
  await llamar("setWebhook", {
    url,
    secret_token: secreto,
    allowed_updates: ["message", "callback_query"],
  });
  await llamar("setMyCommands", {
    commands: [
      { command: "nuevo", description: "Empezar una conversación nueva" },
      { command: "ayuda", description: "Ver qué puede hacer Maggie" },
    ],
  });
}

async function subirFotoDePerfil(jpg: Uint8Array<ArrayBuffer>) {
  const formulario = new FormData();
  formulario.append("photo", JSON.stringify({ type: "static", photo: "attach://avatar" }));
  formulario.append("avatar", new Blob([jpg], { type: "image/jpeg" }), "avatar.jpg");
  const response = await fetch(`${API_BASE}/bot${process.env.TELEGRAM_BOT_TOKEN}/setMyProfilePhoto`, {
    method: "POST",
    body: formulario,
  });
  const data = (await response.json()) as { ok: boolean; description?: string };
  if (!data.ok) throw new TelegramError(data.description ?? "Telegram rechazó la foto de perfil");
}

/** Aplica nombre, textos y foto de Maggie. Devuelve lo que no se pudo aplicar, sin frenar la activación. */
export async function publicarIdentidad(foto: Uint8Array<ArrayBuffer> | null) {
  const pasos: Array<[string, Promise<unknown>]> = [
    ["nombre", llamar("setMyName", { name: MAGGIE.nombre })],
    ["descripción", llamar("setMyDescription", { description: MAGGIE.descripcion })],
    ["descripción corta", llamar("setMyShortDescription", { short_description: MAGGIE.descripcionCorta })],
  ];
  if (foto) pasos.push(["foto", subirFotoDePerfil(foto)]);
  const resultados = await Promise.allSettled(pasos.map(([, paso]) => paso));
  const avisos = resultados.flatMap((resultado, indice) =>
    resultado.status === "rejected" ? [`${pasos[indice][0]}: ${String(resultado.reason?.message ?? resultado.reason)}`] : [],
  );
  if (!foto) avisos.push("foto: no se pudo leer el avatar del sitio");
  return avisos;
}
