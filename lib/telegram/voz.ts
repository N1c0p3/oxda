import { descargarArchivo } from "@/lib/telegram/bot-api";

const API_OPENAI = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

export const MODELO_VOZ = process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-transcribe";
export const MAX_SEGUNDOS_VOZ = 300;
const MAX_BYTES_TELEGRAM = 20 * 1024 * 1024;

// Orienta la transcripción hacia los nombres propios de la operación.
const VOCABULARIO =
  "Maggie, OXDA, Vulpes, prospecto, comisión, kardex, picking, tarima, Guadalajara, GDL, Quintana Roo, Cancún, Cabo San Lucas, hashbrown.";

// Telegram guarda las notas de voz como .oga; OpenAI rechaza esa extensión y acepta el mismo audio como .ogg.
const EXTENSIONES: Record<string, string> = { oga: "ogg", ogg: "ogg", opus: "ogg", mp3: "mp3", m4a: "m4a", mp4: "mp4", mpeg: "mpeg", mpga: "mpga", wav: "wav", webm: "webm", flac: "flac" };

export type AudioTelegram = { file_id: string; duration: number; file_size?: number };

/** Error con un mensaje pensado para mostrarse tal cual en el chat. */
export class VozError extends Error {}

function mensajeDeOpenAI(status: number) {
  if (status === 401) return "Mi clave de voz no es válida, así que no puedo escuchar notas por ahora. Avísale a Dirección y mientras escríbeme.";
  if (status === 429) return "Se me saturó el servicio de voz. Intenta en un minuto o escríbeme.";
  return "No pude entender la nota de voz. Intenta de nuevo o escríbeme.";
}

export async function transcribir(audio: Uint8Array<ArrayBuffer>, ruta: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new VozError("Todavía no tengo configurada la voz. Escríbeme tu mensaje, por favor.");

  const extension = EXTENSIONES[ruta.split(".").pop()?.toLowerCase() ?? ""];
  if (!extension) throw new VozError("No reconozco ese formato de audio. Mándame una nota de voz normal o escríbeme.");

  const formulario = new FormData();
  formulario.append("model", MODELO_VOZ);
  formulario.append("language", "es");
  formulario.append("prompt", VOCABULARIO);
  formulario.append("file", new Blob([audio]), `voz.${extension}`);

  const response = await fetch(`${API_OPENAI}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formulario,
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) {
    console.error("[telegram] OpenAI rechazó el audio", response.status, await response.text());
    throw new VozError(mensajeDeOpenAI(response.status));
  }
  const { text } = (await response.json()) as { text?: string };
  return text?.trim() ?? "";
}

export async function transcribirNota(audio: AudioTelegram) {
  if (audio.duration > MAX_SEGUNDOS_VOZ) {
    throw new VozError(`Esa nota está muy larga. Puedo escuchar hasta ${MAX_SEGUNDOS_VOZ / 60} minutos; divídela o escríbeme.`);
  }
  if (audio.file_size && audio.file_size > MAX_BYTES_TELEGRAM) {
    throw new VozError("Ese audio pesa demasiado para Telegram. Mándame uno más corto.");
  }
  const { bytes, ruta } = await descargarArchivo(audio.file_id);
  return transcribir(bytes, ruta);
}
