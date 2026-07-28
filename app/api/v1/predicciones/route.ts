import { NextResponse } from "next/server";

import { adminClient, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await adminClient()
    .from("predicciones_datos")
    .select("clave, datos")
    .in("clave", ["logistica", "ventas_mensual", "predicciones"]);
  if (error) return supabaseError(error);

  const result: Record<string, unknown> = {};
  data.forEach((row) => {
    result[row.clave] = row.datos ?? {};
  });

  return NextResponse.json({
    logistics: result.logistica ?? {},
    sales: result.ventas_mensual ?? {},
    predictions: result.predicciones ?? {},
  });
}
