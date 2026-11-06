import Anthropic from "@anthropic-ai/sdk";

import { getProfile } from "@/lib/profiles";
import { conversar } from "@/lib/telegram/agente";
import {
  editarMensaje,
  enviarMensaje,
  indicarEscribiendo,
  responderBoton,
} from "@/lib/telegram/bot-api";
import { ejecutarOperaciones } from "@/lib/telegram/herramientas";
import {
  borrarConversacion,
  buscarPorTelegram,
  canjearCodigo,
  cancelarAccion,
  cerrarAccion,
  crearAccion,
  guardarMensaje,
  leerConversacion,
  reclamarAccion,
  registrarActividad,
  registrarUpdate,
  type ResultadoOperacion,
  type Vinculo,
} from "@/lib/telegram/store";
import { transcribirNota, VozError, type AudioTelegram } from "@/lib/telegram/voz";

type UsuarioTelegram = { id: number; username?: string };
type MensajeTelegram = {
  message_id: number;
  from?: UsuarioTelegram;
  chat: { id: number; type: string };
  text?: string;
  voice?: AudioTelegram;
  audio?: AudioTelegram;
};
export type UpdateTelegram = {
  update_id: number;
  message?: MensajeTelegram;
  callback_query?: { id: string; from: UsuarioTelegram; message?: MensajeTelegram; data?: string };
};

const SIN_ACCESO = "Hola, soy Maggie, la asistente de IA de OXDA. Este bot es privado: pide a Dirección tu enlace de vinculación desde el sistema.";
const ACCESO_DESACTIVADO = "Tu acceso a Maggie está desactivado. Habla con Dirección para reactivarlo.";

function bienvenida(vinculo: Vinculo) {
  return `Hola, ${vinculo.nombre}. Soy Maggie, la asistente de IA de OXDA. Ya estás vinculado con el perfil ${getProfile(vinculo.perfil)?.department}.

Escríbeme o mándame una nota de voz, como a una compañera:
- ¿Qué comisiones faltan por autorizar?
- Pasa el prospecto de Juan Pérez a negociación
- Cambia el envío 12 a entregado

Antes de cambiar algo te muestro una tarjeta. Si no la confirmas, no se toca nada.
/nuevo empieza una conversación desde cero.`;
}

function mensajeDeError(error: unknown) {
  if (error instanceof Anthropic.AuthenticationError) return "Mi clave de Claude no es válida. Avísale a Dirección, por favor.";
  if (error instanceof Anthropic.RateLimitError) return "Traigo demasiadas solicitudes en este momento. Intenta en un minuto.";
  if (error instanceof Anthropic.APIConnectionError) return "Se me cortó la conexión. Intenta de nuevo en un momento.";
  return "No pude terminar esto. Intenta de nuevo; si sigue fallando, avísale a Dirección.";
}

function textoDeResultados(resultados: ResultadoOperacion[]) {
  return resultados
    .map((resultado) => `${resultado.ok ? "✅" : "⚠️"} ${resultado.ok ? resultado.detalle : `${resultado.resumen}\n${resultado.detalle}`}`)
    .join("\n");
}

async function manejarInicio(mensaje: MensajeTelegram, usuario: UsuarioTelegram, codigo?: string) {
  const existente = await buscarPorTelegram(usuario.id);
  if (existente) {
    await enviarMensaje(mensaje.chat.id, existente.activo ? bienvenida(existente) : ACCESO_DESACTIVADO);
    return;
  }
  const vinculo = codigo
    ? await canjearCodigo(codigo, { userId: usuario.id, chatId: mensaje.chat.id, username: usuario.username })
    : null;
  if (codigo && !vinculo) {
    await enviarMensaje(mensaje.chat.id, "Este enlace ya se usó o venció. Pide uno nuevo a Dirección.");
    return;
  }
  await enviarMensaje(mensaje.chat.id, vinculo ? bienvenida(vinculo) : SIN_ACCESO);
}

/** Mantiene visible "escribiendo…", que Telegram apaga a los pocos segundos. */
async function conEscribiendo<T>(chatId: number, tarea: () => Promise<T>) {
  const escribiendo = setInterval(() => void indicarEscribiendo(chatId).catch(() => undefined), 4_500);
  void indicarEscribiendo(chatId).catch(() => undefined);
  try {
    return await tarea();
  } finally {
    clearInterval(escribiendo);
  }
}

async function manejarConversacion(vinculo: Vinculo, chatId: number, texto: string) {
  await guardarMensaje(vinculo.id, "user", texto);
  await registrarActividad(vinculo.id);

  await conEscribiendo(chatId, () => responder(vinculo, chatId));
}

async function responder(vinculo: Vinculo, chatId: number) {
  try {
    const { texto: respuesta, propuestas } = await conversar(vinculo, await leerConversacion(vinculo.id));
    await enviarMensaje(chatId, respuesta);

    if (propuestas.length === 0) {
      await guardarMensaje(vinculo.id, "assistant", respuesta);
      return;
    }

    const lista = propuestas.map((propuesta, indice) => `${indice + 1}. ${propuesta.resumen}`).join("\n");
    const accionId = await crearAccion(vinculo, propuestas);
    await enviarMensaje(chatId, `Confirma para aplicar en el sistema:\n\n${lista}`, [[
      { text: "✅ Confirmar", callback_data: `ok:${accionId}` },
      { text: "❌ Cancelar", callback_data: `no:${accionId}` },
    ]]);
    await guardarMensaje(vinculo.id, "assistant", `${respuesta}\n\n[Tarjeta enviada, sin aplicar todavía]\n${lista}`);
  } catch (error) {
    console.error("[telegram] error del agente", error);
    await enviarMensaje(chatId, mensajeDeError(error));
  }
}

async function manejarVoz(vinculo: Vinculo, chatId: number, audio: AudioTelegram) {
  let transcripcion: string;
  try {
    transcripcion = await conEscribiendo(chatId, () => transcribirNota(audio));
  } catch (error) {
    console.error("[telegram] error de voz", error);
    await enviarMensaje(chatId, error instanceof VozError ? error.message : "No pude escuchar esa nota. Intenta de nuevo o escríbeme.");
    return;
  }
  if (!transcripcion) {
    await enviarMensaje(chatId, "No alcancé a escuchar nada en esa nota. ¿Me la repites?");
    return;
  }
  await enviarMensaje(chatId, `🎙️ Escuché: ${transcripcion}`);
  await manejarConversacion(vinculo, chatId, `[Nota de voz transcrita] ${transcripcion}`);
}

async function manejarMensaje(mensaje: MensajeTelegram) {
  const usuario = mensaje.from;
  if (!usuario || mensaje.chat.type !== "private") return;
  const texto = mensaje.text?.trim();

  if (texto?.startsWith("/start")) {
    await manejarInicio(mensaje, usuario, texto.split(/\s+/)[1]);
    return;
  }

  const vinculo = await buscarPorTelegram(usuario.id);
  if (!vinculo) {
    await enviarMensaje(mensaje.chat.id, SIN_ACCESO);
    return;
  }
  if (!vinculo.activo) {
    await enviarMensaje(mensaje.chat.id, ACCESO_DESACTIVADO);
    return;
  }
  if (!texto) {
    const audio = mensaje.voice ?? mensaje.audio;
    if (audio) await manejarVoz(vinculo, mensaje.chat.id, audio);
    else await enviarMensaje(mensaje.chat.id, "Por ahora entiendo texto y notas de voz. Fotos y documentos todavía no.");
    return;
  }
  if (texto === "/nuevo") {
    await borrarConversacion(vinculo.id);
    await enviarMensaje(mensaje.chat.id, "Listo, empezamos de cero.");
    return;
  }
  if (texto === "/ayuda") {
    await enviarMensaje(mensaje.chat.id, bienvenida(vinculo));
    return;
  }
  await manejarConversacion(vinculo, mensaje.chat.id, texto);
}

async function manejarBoton(boton: NonNullable<UpdateTelegram["callback_query"]>) {
  const mensaje = boton.message;
  const coincidencia = boton.data?.match(/^(ok|no):([0-9a-f-]{36})$/);
  if (!mensaje || mensaje.chat.type !== "private" || !coincidencia) {
    await responderBoton(boton.id);
    return;
  }
  const [, decision, accionId] = coincidencia;

  const vinculo = await buscarPorTelegram(boton.from.id);
  if (!vinculo?.activo) {
    await responderBoton(boton.id, "Sin acceso");
    return;
  }

  if (decision === "no") {
    const cancelada = await cancelarAccion(accionId, vinculo.id);
    await responderBoton(boton.id, cancelada ? "Cancelado" : "Esta tarjeta ya no está vigente");
    if (cancelada) {
      await editarMensaje(mensaje.chat.id, mensaje.message_id, `❌ Cancelado, no se tocó nada.\n\n${mensaje.text ?? ""}`);
      await guardarMensaje(vinculo.id, "assistant", "[El usuario canceló la tarjeta; no se aplicó ningún cambio]");
    }
    return;
  }

  const accion = await reclamarAccion(accionId, vinculo.id);
  if (!accion) {
    await responderBoton(boton.id, "Esta tarjeta venció o ya se atendió. Pídeme el cambio de nuevo.");
    return;
  }
  await responderBoton(boton.id, "Aplicando…");

  const resultados = await ejecutarOperaciones(vinculo.perfil, accion.operaciones);
  const correctas = resultados.filter((resultado) => resultado.ok).length;
  const estatus = correctas === resultados.length ? "ejecutada" : correctas > 0 ? "parcial" : "fallida";
  await cerrarAccion(accion.id, estatus, resultados);

  const detalle = textoDeResultados(resultados);
  await editarMensaje(mensaje.chat.id, mensaje.message_id, detalle);
  await guardarMensaje(vinculo.id, "assistant", `[Resultado de la tarjeta confirmada]\n${detalle}`);
}

export async function procesarUpdate(update: UpdateTelegram) {
  if (!(await registrarUpdate(update.update_id))) return;
  if (update.callback_query) await manejarBoton(update.callback_query);
  else if (update.message) await manejarMensaje(update.message);
}
