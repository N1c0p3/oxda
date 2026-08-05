import { NextResponse } from "next/server";
import logisticsSnapshot from "@/public/data/logistica.json";
import salesSnapshot from "@/public/data/ventas_mensual.json";
import predictionsSnapshot from "@/public/data/predicciones.json";

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

  // Los JSON son el último corte validado de los libros. Supabase puede ser
  // actualizado por el importador, pero una tabla vacía no debe dejar el
  // módulo predictivo sin datos.
  const logistics = Object.keys((result.logistica ?? {}) as Record<string, unknown>).length
    ? result.logistica as Record<string, unknown>
    : logisticsSnapshot as Record<string, unknown>;
  const sales = Object.keys((result.ventas_mensual ?? {}) as Record<string, unknown>).length
    ? result.ventas_mensual as Record<string, unknown>
    : salesSnapshot as Record<string, unknown>;
  const predictions = Object.keys((result.predicciones ?? {}) as Record<string, unknown>).length
    ? result.predicciones as Record<string, unknown>
    : predictionsSnapshot as Record<string, unknown>;
  const source = result.logistica && result.ventas_mensual && result.predicciones ? "base" : "corte_validado";

  return NextResponse.json({
    logistics: {
      containers: logistics.containers ?? [],
      metrics: {
        totalContenedores: 0,
        leadTimesGlobal: {},
        leadTimesByPort: {},
        leadTimesByClient: {},
        ...(logistics.metrics as Record<string, unknown> | undefined),
      },
      supplierControls: logistics.supplierControls ?? [],
    },
    sales: {
      monthly: sales.monthly ?? [],
      productWarehouse: sales.productWarehouse ?? [],
      productSeries: sales.productSeries ?? {},
      productNames: sales.productNames ?? {},
      dateRange: sales.dateRange ?? { min: "", max: "" },
    },
    predictions: {
      leadTimeAvgDays: predictions.leadTimeAvgDays ?? 0,
      shelfLifeDays: predictions.shelfLifeDays ?? 0,
      demandPredictions: predictions.demandPredictions ?? [],
      monthlyProjection: predictions.monthlyProjection ?? [],
    },
    source,
    refreshedAt: new Date().toISOString(),
  });
}
