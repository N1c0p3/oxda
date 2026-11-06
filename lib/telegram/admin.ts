import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

function huella(valor: string) {
  return createHash("sha256").update(valor).digest();
}

export function secretosIguales(recibido: string | null, esperado: string | undefined) {
  if (!recibido || !esperado) return false;
  return timingSafeEqual(huella(recibido), huella(esperado));
}

/**
 * Los perfiles del sistema no tienen contraseña, así que el panel de vinculación
 * se protege con una clave propia validada en el servidor.
 * Devuelve la respuesta de rechazo, o null si la clave es correcta.
 */
export function rechazarSiNoEsAdmin(request: Request) {
  const clave = process.env.TELEGRAM_ADMIN_KEY;
  if (!clave) {
    return NextResponse.json({ error: "Falta configurar TELEGRAM_ADMIN_KEY en el servidor" }, { status: 503 });
  }
  if (!secretosIguales(request.headers.get("x-admin-key"), clave)) {
    return NextResponse.json({ error: "Clave de administración incorrecta" }, { status: 401 });
  }
  return null;
}
