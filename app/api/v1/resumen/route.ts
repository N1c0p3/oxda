import { NextResponse } from "next/server";

import { adminClient, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const periodo = url.searchParams.get("periodo") || "2026";
  const { data, error } = await adminClient()
    .from("resumen_global")
    .select("*")
    .eq("periodo", periodo)
    .single();
  if (error) return supabaseError(error);
  return NextResponse.json({
    periodo: data.periodo,
    divisiones: data.divisiones ?? [],
    ventasMensuales: data.ventas_mensuales ?? [],
    topClientes: data.top_clientes ?? [],
    ventasCanal: data.ventas_canal ?? [],
    topVendedores: data.top_vendedores ?? [],
    totales: data.totales ?? {},
  });
}
