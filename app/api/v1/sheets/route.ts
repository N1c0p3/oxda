import { NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

const INGRESOS_URL =
  "https://docs.google.com/spreadsheets/d/1x_fpgQ2IElPzu1ArHYb1x2F-zGN3KPhqMdG9ePjN8B8/export?format=csv&gid=0";
const EGRESOS_URL =
  "https://docs.google.com/spreadsheets/d/1Okkoehf_pIPqD0nw9cP0NFPoL2GiBd53P6fmvO8bWt8/export?format=csv&gid=0";

function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.replace(/\r/g, "").trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
    });
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
  let source: "sheets" | "supabase" = "supabase";
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
    if (ingData || egrData) {
      source = "sheets";
    } else {
      const fallback = await loadSupabaseFallback();
      if (!ingData) ingresos = fallback.ingresos;
      if (!egrData) egresos = fallback.egresos;
    }
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

  return NextResponse.json({
    ingresos,
    egresos,
    source,
    error,
    fetchedAt: new Date().toISOString(),
  });
}
