import { NextResponse } from "next/server";

import { adminClient, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const periodo = url.searchParams.get("periodo") || "2026";
  const { data, error } = await adminClient()
    .from("analisis_dashboard")
    .select("*")
    .eq("periodo", periodo)
    .single();
  if (error) return supabaseError(error);
  return NextResponse.json({
    periodo: data.periodo,
    analisisTendencias: data.tendencias ?? [],
    eficienciaClientes: data.eficiencia_clientes ?? [],
    proyeccionTrimestre: data.proyeccion_trimestre ?? [],
    kpis: data.kpis ?? {},
  });
}
