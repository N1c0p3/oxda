import { NextResponse } from "next/server";

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

const MOCK_INGRESOS: Record<string, string>[] = [
  { "Tipo de gasto": "Ingreso",                                     Importe: "12000", Dia: "11", Mes: "7", "Año": "2025" },
  { "Tipo de gasto": "Ingreso",                                     Importe: "10000", Dia: "11", Mes: "7", "Año": "2025" },
  { "Tipo de gasto": "Ingreso",                                     Importe: "500",   Dia: "11", Mes: "7", "Año": "2025" },
  { "Tipo de gasto": "Ingreso mensual",                             Importe: "2000",  Dia: "28", Mes: "7", "Año": "2025" },
  { "Tipo de gasto": "Campaña, Bot y Plataforma Digital",           Importe: "45000", Dia: "26", Mes: "7", "Año": "2025" },
  { "Tipo de gasto": "Campaña, bot y plataforma digital",           Importe: "45000", Dia: "26", Mes: "7", "Año": "2025" },
  { "Tipo de gasto": "Ingreso por campaña Facebook Ads",            Importe: "25000", Dia: "5",  Mes: "9", "Año": "2025" },
  { "Tipo de gasto": "Campaña Publicitaria",                        Importe: "25000", Dia: "18", Mes: "9", "Año": "2025" },
  { "Tipo de gasto": "Ingreso por campaña y desarrollo de página web", Importe: "35000", Dia: "18", Mes: "9", "Año": "2025" },
  { "Tipo de gasto": "Desarrollo inmobiliario",                     Importe: "45000", Dia: "23", Mes: "9", "Año": "2025" },
  { "Tipo de gasto": "Desarrollo del sistema NFC",                  Importe: "35000", Dia: "24", Mes: "9", "Año": "2025" },
  { "Tipo de gasto": "Desarrollo, campaña e implementación",        Importe: "75000", Dia: "26", Mes: "9", "Año": "2025" },
  { "Tipo de gasto": "Ingreso por radiografías y consulta",         Importe: "25000", Dia: "4",  Mes: "10", "Año": "2025" },
  { "Tipo de gasto": "Ingreso por servicios",                       Importe: "38000", Dia: "15", Mes: "10", "Año": "2025" },
  { "Tipo de gasto": "Campaña e implementación QR acceso escolar",  Importe: "45000", Dia: "29", Mes: "9", "Año": "2025" },
  { "Tipo de gasto": "CRM inteligente tema dental",                 Importe: "35000", Dia: "1",  Mes: "10", "Año": "2025" },
];

const MOCK_EGRESOS: Record<string, string>[] = [
  { "Tipo de gasto": "Gasto",                                      Importe: "11000",  Dia: "11", Mes: "7", "Año": "2025" },
  { "Tipo de gasto": "Gasto inesperado",                           Importe: "12000",  Dia: "11", Mes: "7", "Año": "2025" },
  { "Tipo de gasto": "Pago de luz",                                Importe: "45000",  Dia: "14", Mes: "6", "Año": "2025" },
  { "Tipo de gasto": "Pago de luz",                                Importe: "45000",  Dia: "14", Mes: "7", "Año": "2025" },
  { "Tipo de gasto": "Internet Consultorio",                       Importe: "1500",   Dia: "25", Mes: "7", "Año": "2025" },
  { "Tipo de gasto": "Mano de obra",                               Importe: "3500",   Dia: "26", Mes: "7", "Año": "2025" },
  { "Tipo de gasto": "Impermeabilizante",                          Importe: "35000",  Dia: "26", Mes: "7", "Año": "2025" },
  { "Tipo de gasto": "Costos operativos de cirugía",               Importe: "12000",  Dia: "2",  Mes: "8", "Año": "2025" },
  { "Tipo de gasto": "Campaña Publicitaria",                       Importe: "15000",  Dia: "11", Mes: "8", "Año": "2025" },
  { "Tipo de gasto": "Gastos publicitarios",                       Importe: "15000",  Dia: "12", Mes: "8", "Año": "2025" },
  { "Tipo de gasto": "Costo y pago de mantenimiento",              Importe: "12000",  Dia: "16", Mes: "8", "Año": "2025" },
  { "Tipo de gasto": "inversión inicial, Bolsen",                  Importe: "14000",  Dia: "18", Mes: "8", "Año": "2025" },
  { "Tipo de gasto": "Sueldos Fever",                              Importe: "100000", Dia: "24", Mes: "9", "Año": "2025" },
  { "Tipo de gasto": "Desarrollo hidráulico",                      Importe: "25000",  Dia: "26", Mes: "9", "Año": "2025" },
  { "Tipo de gasto": "Gastos de campaña",                          Importe: "25000",  Dia: "23", Mes: "9", "Año": "2025" },
  { "Tipo de gasto": "Publicidad y desarrollo de crm inteligente", Importe: "120000", Dia: "7",  Mes: "10", "Año": "2025" },
  { "Tipo de gasto": "costos operativos",                          Importe: "25000",  Dia: "25", Mes: "10", "Año": "2025" },
];

export async function GET() {
  let ingresos = MOCK_INGRESOS;
  let egresos = MOCK_EGRESOS;
  let source: "sheets" | "mock" = "mock";
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
    if (ingData || egrData) source = "sheets";
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  return NextResponse.json({
    ingresos,
    egresos,
    source,
    error,
    fetchedAt: new Date().toISOString(),
  });
}
