import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_SESION = "oxda_sesion";
export const DURACION_SESION_SEGUNDOS = 12 * 60 * 60;

export type Sesion = { perfil: string; exp: number };

function firmar(datos: string, secreto: string) {
  return createHmac("sha256", secreto).update(datos).digest("base64url");
}

export function crearSesion(perfil: string) {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) throw new Error("Falta AUTH_SECRET");
  const exp = Math.floor(Date.now() / 1000) + DURACION_SESION_SEGUNDOS;
  const datos = Buffer.from(JSON.stringify({ perfil, exp })).toString("base64url");
  return `${datos}.${firmar(datos, secreto)}`;
}

/** Sin AUTH_SECRET ninguna sesión es válida: el sistema queda cerrado, no abierto. */
export function leerSesion(token: string | undefined): Sesion | null {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto || !token) return null;
  const [datos, firma] = token.split(".");
  if (!datos || !firma) return null;

  const esperada = Buffer.from(firmar(datos, secreto));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;

  try {
    const sesion = JSON.parse(Buffer.from(datos, "base64url").toString()) as Sesion;
    return sesion.exp > Date.now() / 1000 ? sesion : null;
  } catch {
    return null;
  }
}
