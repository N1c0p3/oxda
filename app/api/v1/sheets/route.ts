import { NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

const INGRESOS_URL =
  "https://docs.google.com/spreadsheets/d/1x_fpgQ2IElPzu1ArHYb1x2F-zGN3KPhqMdG9ePjN8B8/export?format=csv&gid=0";
const EGRESOS_URL =
  "https://docs.google.com/spreadsheets/d/1Okkoehf_pIPqD0nw9cP0NFPoL2GiBd53P6fmvO8bWt8/export?format=csv&gid=0";

function parseCsv(csv: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  const input = csv.replace(/\r/g, "");
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else value += char;
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value.trim());
      value = "";
    } else if (char === "\n") {
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else value += char;
  }
  if (value || row.length) {
    row.push(value.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  if (rows.length < 2) return [];
  const [headers, ...data] = rows;
  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

async function fetchSheet(url: string): Promise<Record<string, string>[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (text.includes("<!DOCTYPE html")) throw new Error("Not public");
  return parseCsv(text);
}

async function loadSupabaseFallback() {
  const { data, error } = await adminClient()
    .from("ia_sheets_registros")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  const ingresos = data
    .filter((r) => r.tipo === "ingreso")
    .map((r) => ({
      "Tipo de gasto": r.categoria,
      Importe: numberValue(r.importe).toFixed(2),
      Dia: String(r.dia),
      Mes: String(r.mes),
      "Año": String(r.anio),
    }));
  const egresos = data
    .filter((r) => r.tipo === "egreso")
    .map((r) => ({
      "Tipo de gasto": r.categoria,
      Importe: numberValue(r.importe).toFixed(2),
      Dia: String(r.dia),
      Mes: String(r.mes),
      "Año": String(r.anio),
    }));
  return { ingresos, egresos };
}

export async function GET() {
  let ingresos: Record<string, string>[] = [];
  let egresos: Record<string, string>[] = [];
  let source: "data" | "respaldo" = "respaldo";
  let error: string | null = null;

  try {
    const [ing, egr] = await Promise.allSettled([
      fetchSheet(INGRESOS_URL),
      fetchSheet(EGRESOS_URL),
    ]);
    const ingData = ing.status === "fulfilled" && ing.value.length > 0 ? ing.value : null;
    const egrData = egr.status === "fulfilled" && egr.value.length > 0 ? egr.value : null;

    if (ingData) ingresos = ingData;
    if (egrData) egresos = egrData;
    const fallback = !ingData || !egrData ? await loadSupabaseFallback() : null;
    if (!ingData) ingresos = fallback?.ingresos ?? [];
    if (!egrData) egresos = fallback?.egresos ?? [];
    if (ingData || egrData) source = "data";
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
    try {
      const fallback = await loadSupabaseFallback();
      ingresos = fallback.ingresos;
      egresos = fallback.egresos;
    } catch (fallbackError) {
      error += `; fallback: ${fallbackError instanceof Error ? fallbackError.message : "error"}`;
    }
  }

  const byNewestDate = (a: Record<string, string>, b: Record<string, string>) => {
    const aDate = new Date(Number(a["Año"] || 0), Number(a["Mes"] || 1) - 1, Number(a.Dia || 1)).getTime();
    const bDate = new Date(Number(b["Año"] || 0), Number(b["Mes"] || 1) - 1, Number(b.Dia || 1)).getTime();
    return bDate - aDate;
  };
  return NextResponse.json({
    ingresos: ingresos.sort(byNewestDate),
    egresos: egresos.sort(byNewestDate),
    source,
    error,
    fetchedAt: new Date().toISOString(),
  });
}
