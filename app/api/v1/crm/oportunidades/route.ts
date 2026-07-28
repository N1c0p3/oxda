import { NextRequest, NextResponse } from "next/server";

import { db, type Oportunidad } from "@/lib/demo-db";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  if (!payload.clienteId || !payload.nombre || !payload.etapa) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const probabilidad = Number(payload.probabilidad ?? 0);
  const montoEstimado = Number(payload.montoEstimado ?? 0);
  if (probabilidad < 0 || probabilidad > 100 || montoEstimado < 0) {
    return NextResponse.json({ error: "Datos fuera de rango" }, { status: 400 });
  }

  const etapa = String(payload.etapa) as Oportunidad["etapa"];

  const registro: Oportunidad = {
    id: db.oportunidades.length + 1,
    clienteId: Number(payload.clienteId),
    vendedorId: Number(payload.vendedorId ?? 0),
    nombre: String(payload.nombre),
    etapa,
    probabilidad,
    montoEstimado,
    cierreEstimado: payload.cierreEstimado ? String(payload.cierreEstimado) : undefined,
    createdAt: new Date().toISOString(),
  };

  db.oportunidades.push(registro);
  return NextResponse.json(registro, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ items: db.oportunidades, total: db.oportunidades.length });
}
