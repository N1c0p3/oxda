import { createHash, randomBytes } from "node:crypto";

import type { ProfileId } from "@/lib/profiles";
import { adminClient } from "@/lib/supabase/api";

const HORAS_CODIGO = 24;
const MINUTOS_CONFIRMACION = 30;
const MENSAJES_EN_CONTEXTO = 30;

export type Vinculo = {
  id: number;
  nombre: string;
  perfil: ProfileId;
  activo: boolean;
  telegram_user_id: number | null;
  telegram_chat_id: number | null;
  telegram_username: string | null;
  codigo_expira: string | null;
  vinculado_at: string | null;
  ultimo_mensaje_at: string | null;
  created_at: string;
};

export type OperacionPropuesta = { herramienta: string; entrada: unknown; resumen: string };
export type ResultadoOperacion = { resumen: string; ok: boolean; detalle: string };

export type Accion = {
  id: string;
  vinculo_id: number | null;
  autor: string;
  perfil: ProfileId;
  operaciones: OperacionPropuesta[];
  resultados: ResultadoOperacion[] | null;
  estatus: string;
  expira_at: string;
  resuelta_at: string | null;
  created_at: string;
};

const COLUMNAS_VINCULO =
  "id, nombre, perfil, activo, telegram_user_id, telegram_chat_id, telegram_username, codigo_expira, vinculado_at, ultimo_mensaje_at, created_at";

function hashCodigo(codigo: string) {
  return createHash("sha256").update(codigo).digest("hex");
}

function nuevoCodigo() {
  const codigo = randomBytes(16).toString("hex");
  return {
    codigo,
    campos: {
      codigo_hash: hashCodigo(codigo),
      codigo_expira: new Date(Date.now() + HORAS_CODIGO * 3_600_000).toISOString(),
    },
  };
}

function exigir<T>(resultado: { data: T; error: { message: string } | null }) {
  if (resultado.error) throw new Error(resultado.error.message);
  return resultado.data;
}

export async function listarVinculos() {
  const resultado = await adminClient()
    .from("telegram_vinculos")
    .select(COLUMNAS_VINCULO)
    .order("created_at", { ascending: false });
  return exigir(resultado) as unknown as Vinculo[];
}

export async function crearVinculo(nombre: string, perfil: ProfileId) {
  const { codigo, campos } = nuevoCodigo();
  const resultado = await adminClient()
    .from("telegram_vinculos")
    .insert({ nombre, perfil, ...campos })
    .select(COLUMNAS_VINCULO)
    .single();
  return { vinculo: exigir(resultado) as unknown as Vinculo, codigo };
}

/** Invalida la cuenta de Telegram anterior y emite un enlace nuevo. */
export async function regenerarVinculo(id: number) {
  const { codigo, campos } = nuevoCodigo();
  const cliente = adminClient();
  const resultado = await cliente
    .from("telegram_vinculos")
    .update({
      ...campos,
      telegram_user_id: null,
      telegram_chat_id: null,
      telegram_username: null,
      vinculado_at: null,
    })
    .eq("id", id)
    .select(COLUMNAS_VINCULO)
    .maybeSingle();
  const vinculo = exigir(resultado) as unknown as Vinculo | null;
  if (!vinculo) throw new Error("Vínculo no encontrado");
  await borrarConversacion(id);
  return { vinculo, codigo };
}

export async function actualizarVinculo(id: number, cambios: { activo?: boolean; perfil?: ProfileId }) {
  const resultado = await adminClient()
    .from("telegram_vinculos")
    .update(cambios)
    .eq("id", id)
    .select(COLUMNAS_VINCULO)
    .maybeSingle();
  const vinculo = exigir(resultado) as unknown as Vinculo | null;
  if (!vinculo) throw new Error("Vínculo no encontrado");
  return vinculo;
}

export async function eliminarVinculo(id: number) {
  exigir(await adminClient().from("telegram_vinculos").delete().eq("id", id));
}

export async function buscarPorTelegram(telegramUserId: number) {
  const resultado = await adminClient()
    .from("telegram_vinculos")
    .select(COLUMNAS_VINCULO)
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();
  return exigir(resultado) as unknown as Vinculo | null;
}

/** Canjea un código de un solo uso; devuelve null si no existe, venció o ya se usó. */
export async function canjearCodigo(
  codigo: string,
  telegram: { userId: number; chatId: number; username?: string },
) {
  const resultado = await adminClient()
    .from("telegram_vinculos")
    .update({
      telegram_user_id: telegram.userId,
      telegram_chat_id: telegram.chatId,
      telegram_username: telegram.username ?? null,
      vinculado_at: new Date().toISOString(),
      codigo_hash: null,
      codigo_expira: null,
    })
    .eq("codigo_hash", hashCodigo(codigo))
    .is("telegram_user_id", null)
    .gt("codigo_expira", new Date().toISOString())
    .select(COLUMNAS_VINCULO)
    .maybeSingle();
  return exigir(resultado) as unknown as Vinculo | null;
}

export async function registrarActividad(vinculoId: number) {
  exigir(
    await adminClient()
      .from("telegram_vinculos")
      .update({ ultimo_mensaje_at: new Date().toISOString() })
      .eq("id", vinculoId),
  );
}

export async function leerConversacion(vinculoId: number) {
  const resultado = await adminClient()
    .from("telegram_mensajes")
    .select("rol, contenido")
    .eq("vinculo_id", vinculoId)
    .order("id", { ascending: false })
    .limit(MENSAJES_EN_CONTEXTO);
  const filas = (exigir(resultado) ?? []) as Array<{ rol: "user" | "assistant"; contenido: string }>;
  const mensajes = filas.reverse();
  // La API exige que la conversación empiece con el usuario.
  const inicio = mensajes.findIndex((mensaje) => mensaje.rol === "user");
  return inicio === -1 ? [] : mensajes.slice(inicio);
}

export async function guardarMensaje(vinculoId: number, rol: "user" | "assistant", contenido: string) {
  exigir(await adminClient().from("telegram_mensajes").insert({ vinculo_id: vinculoId, rol, contenido }));
}

export async function borrarConversacion(vinculoId: number) {
  exigir(await adminClient().from("telegram_mensajes").delete().eq("vinculo_id", vinculoId));
}

export async function crearAccion(vinculo: Vinculo, operaciones: OperacionPropuesta[]) {
  const resultado = await adminClient()
    .from("telegram_acciones")
    .insert({
      vinculo_id: vinculo.id,
      autor: vinculo.nombre,
      perfil: vinculo.perfil,
      operaciones,
      expira_at: new Date(Date.now() + MINUTOS_CONFIRMACION * 60_000).toISOString(),
    })
    .select("id")
    .single();
  return (exigir(resultado) as { id: string }).id;
}

/** Reclamo atómico: un doble toque en el botón no puede ejecutar dos veces. */
export async function reclamarAccion(id: string, vinculoId: number) {
  const resultado = await adminClient()
    .from("telegram_acciones")
    .update({ estatus: "ejecutando" })
    .eq("id", id)
    .eq("vinculo_id", vinculoId)
    .eq("estatus", "pendiente")
    .gt("expira_at", new Date().toISOString())
    .select("*")
    .maybeSingle();
  return exigir(resultado) as unknown as Accion | null;
}

export async function cancelarAccion(id: string, vinculoId: number) {
  const resultado = await adminClient()
    .from("telegram_acciones")
    .update({ estatus: "cancelada", resuelta_at: new Date().toISOString() })
    .eq("id", id)
    .eq("vinculo_id", vinculoId)
    .eq("estatus", "pendiente")
    .select("id")
    .maybeSingle();
  return exigir(resultado) !== null;
}

export async function cerrarAccion(id: string, estatus: string, resultados: ResultadoOperacion[]) {
  exigir(
    await adminClient()
      .from("telegram_acciones")
      .update({ estatus, resultados, resuelta_at: new Date().toISOString() })
      .eq("id", id),
  );
}

export async function listarAcciones(limite = 50) {
  const resultado = await adminClient()
    .from("telegram_acciones")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);
  return exigir(resultado) as unknown as Accion[];
}

/** Devuelve false si Telegram ya había entregado este update. */
export async function registrarUpdate(updateId: number) {
  const cliente = adminClient();
  const { error } = await cliente.from("telegram_updates").insert({ update_id: updateId });
  if (error?.code === "23505") return false;
  if (error) throw new Error(error.message);
  const haceUnaSemana = new Date(Date.now() - 7 * 86_400_000).toISOString();
  await cliente.from("telegram_updates").delete().lt("created_at", haceUnaSemana);
  return true;
}
