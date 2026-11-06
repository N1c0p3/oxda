#!/usr/bin/env node
// Crea las cuentas del sistema en Supabase Auth y guarda las contraseñas nuevas en .env.accesos.
// Uso: node scripts/crear_accesos.mjs                   crea las cuentas que falten
//      node scripts/crear_accesos.mjs --restablecer juan  genera otra contraseña para ese usuario
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.

import { randomBytes } from "crypto";
import { appendFileSync, chmodSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CUENTAS = [
  { usuario: "juan", perfil: "contador" },
  { usuario: "angeles", perfil: "logistica" },
  { usuario: "gama", perfil: "ventas" },
  { usuario: "direccion", perfil: "direccion" },
];

const env = {};
for (const linea of readFileSync(resolve(root, ".env.local"), "utf-8").split(/\r?\n/)) {
  const match = linea.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const correo = (usuario) => `${usuario}@oxda.space`;
const nuevaPassword = () => randomBytes(12).toString("base64url");

function guardar(usuario, password) {
  const archivo = resolve(root, ".env.accesos");
  appendFileSync(archivo, `${usuario}=${password}\n`);
  chmodSync(archivo, 0o600);
}

const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
if (error) throw error;
const existentes = new Map(data.users.map((user) => [user.email, user]));

const indice = process.argv.indexOf("--restablecer");
if (indice !== -1) {
  const usuario = process.argv[indice + 1];
  const existente = existentes.get(correo(usuario));
  if (!existente) throw new Error(`No existe la cuenta ${usuario}`);
  const password = nuevaPassword();
  const { error: fallo } = await supabase.auth.admin.updateUserById(existente.id, { password });
  if (fallo) throw fallo;
  guardar(usuario, password);
  console.log(`Contraseña de ${usuario} restablecida. Está en .env.accesos.`);
} else {
  for (const { usuario, perfil } of CUENTAS) {
    if (existentes.has(correo(usuario))) {
      console.log(`${usuario}: ya existía`);
      continue;
    }
    const password = nuevaPassword();
    const { error: fallo } = await supabase.auth.admin.createUser({
      email: correo(usuario),
      password,
      email_confirm: true,
      app_metadata: { perfil },
    });
    if (fallo) throw fallo;
    guardar(usuario, password);
    console.log(`${usuario}: creada con perfil ${perfil}`);
  }
}
