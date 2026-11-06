import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_SESION, crearSesion, DURACION_SESION_SEGUNDOS } from "@/lib/auth/sesion";
import { correoDeUsuario } from "@/lib/auth/usuarios";
import { getProfile, type ProfileId } from "@/lib/profiles";

export const dynamic = "force-dynamic";

const CREDENCIALES_INVALIDAS = "Usuario o contraseña incorrectos";

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "El acceso no está configurado" }, { status: 503 });
  }

  const payload = (await request.json().catch(() => ({}))) as { usuario?: unknown; password?: unknown };
  if (typeof payload.usuario !== "string" || typeof payload.password !== "string" || !payload.usuario || !payload.password) {
    return NextResponse.json({ error: CREDENCIALES_INVALIDAS }, { status: 401 });
  }

  const cliente = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await cliente.auth.signInWithPassword({
    email: correoDeUsuario(payload.usuario),
    password: payload.password,
  });
  if (error?.status === 429) {
    return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  }

  // El perfil vive en app_metadata, que solo se escribe con la clave de servicio.
  // Quien se registre por su cuenta en Supabase no tiene perfil y no entra.
  const perfil = getProfile((data.user?.app_metadata?.perfil ?? null) as ProfileId | null);
  if (error || !perfil) {
    return NextResponse.json({ error: CREDENCIALES_INVALIDAS }, { status: 401 });
  }

  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_SESION, crearSesion(perfil.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS,
  });
  return respuesta;
}
