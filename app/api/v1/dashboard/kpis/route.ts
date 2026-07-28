import { NextResponse } from "next/server";

import { db } from "@/lib/demo-db";

export async function GET() {
  const kgProcesados = db.capturas.reduce((acc, item) => acc + item.kgProcesado, 0);
  const kgMerma = db.capturas.reduce((acc, item) => acc + item.kgMerma, 0);
  const mermaPct = kgProcesados ? (kgMerma / kgProcesados) * 100 : 0;

  const pedidos = db.pedidos.length;
  const envios = db.envios.length;
  const enviados = db.envios.filter((item) => ["enviado", "entregado"].includes(item.estatus)).length;
  const fillRate = pedidos ? (enviados / pedidos) * 100 : 0;

  const ventasTotal = db.pedidos.reduce((acc, item) => acc + item.total, 0);

  return NextResponse.json({
    kgProcesados: Number(kgProcesados.toFixed(2)),
    mermaPct: Number(mermaPct.toFixed(2)),
    pedidos,
    envios,
    fillRate: Number(fillRate.toFixed(2)),
    ventasTotal: Number(ventasTotal.toFixed(2)),
  });
}
