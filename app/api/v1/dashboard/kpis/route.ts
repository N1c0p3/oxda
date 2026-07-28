import { NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export async function GET() {
  const client = adminClient();
  const [capturasResult, pedidosResult, enviosResult] = await Promise.all([
    client.from("produccion_capturas").select("kg_procesado, kg_merma"),
    client.from("ventas_pedidos").select("total"),
    client.from("logistica_envios").select("estatus"),
  ]);
  const error = capturasResult.error ?? pedidosResult.error ?? enviosResult.error;
  if (error) return supabaseError(error);
  const capturas = capturasResult.data ?? [];
  const pedidosData = pedidosResult.data ?? [];
  const enviosData = enviosResult.data ?? [];
  const kgProcesados = capturas.reduce((total, item) => total + numberValue(item.kg_procesado), 0);
  const kgMerma = capturas.reduce((total, item) => total + numberValue(item.kg_merma), 0);
  const pedidos = pedidosData.length;
  const envios = enviosData.length;
  const enviados = enviosData.filter((item) => ["enviado", "entregado"].includes(item.estatus)).length;
  const ventasTotal = pedidosData.reduce((total, item) => total + numberValue(item.total), 0);
  return NextResponse.json({
    kgProcesados: Number(kgProcesados.toFixed(2)),
    mermaPct: Number((kgProcesados ? kgMerma / kgProcesados * 100 : 0).toFixed(2)),
    pedidos,
    envios,
    fillRate: Number((pedidos ? enviados / pedidos * 100 : 0).toFixed(2)),
    ventasTotal: Number(ventasTotal.toFixed(2)),
  });
}
