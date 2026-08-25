import { NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await adminClient()
    .from("almacenes_metricas")
    .select("*")
    .order("id", { ascending: true });
  if (error) return supabaseError(error);
  const items = data.map((a) => ({
    almacen: a.almacen,
    valor: numberValue(a.valor),
    cajas: numberValue(a.cajas),
    costoProm: numberValue(a.costo_prom),
    ventasMes: numberValue(a.ventas_mes),
    llegadas: numberValue(a.llegadas),
    ventasEst: numberValue(a.ventas_est),
    cobertura: numberValue(a.cobertura),
    status: a.status,
  }));
  return NextResponse.json({ items, total: items.length });
}
