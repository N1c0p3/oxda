#!/usr/bin/env node
// Carga los archivos JSON de public/data a la tabla predicciones_datos en Supabase.
// Uso: node scripts/importar_predicciones.mjs
// Requiere las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv(path) {
  const content = readFileSync(path, "utf-8");
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, raw] = match;
    vars[key] = raw.replace(/^["']|["']$/g, "").trim();
  }
  return vars;
}

const env = loadEnv(resolve(root, ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const files = [
  { clave: "logistica", file: "public/data/logistica.json" },
  { clave: "ventas_mensual", file: "public/data/ventas_mensual.json" },
  { clave: "predicciones", file: "public/data/predicciones.json" },
];

async function main() {
  for (const { clave, file } of files) {
    const datos = JSON.parse(readFileSync(resolve(root, file), "utf-8"));
    const { error } = await supabase
      .from("predicciones_datos")
      .upsert({ clave, datos, updated_at: new Date().toISOString() }, { onConflict: "clave" });
    if (error) {
      console.error(`Error cargando ${clave}:`, error);
      process.exit(1);
    }
    console.log(`Cargado ${clave}: ${JSON.stringify(datos).length} caracteres`);
  }
  console.log("Importación completada.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
