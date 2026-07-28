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

  const logistics = (result.logistica ?? {}) as Record<string, unknown>;
  const sales = (result.ventas_mensual ?? {}) as Record<string, unknown>;
  const predictions = (result.predicciones ?? {}) as Record<string, unknown>;

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
  });
}
