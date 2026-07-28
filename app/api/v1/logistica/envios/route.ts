import { NextRequest, NextResponse } from "next/server";

import { db, type Envio } from "@/lib/demo-db";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const pedidoId = Number(payload.pedidoId);

  if (!pedidoId) {
    return NextResponse.json({ error: "pedidoId es obligatorio" }, { status: 400 });
  }

  const pedido = db.pedidos.find((item) => item.id === pedidoId);
  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const envio: Envio = {
    id: db.envios.length + 1,
    pedidoId,
    clienteNombre: pedido.clienteNombre,
    fechaSalida: payload.fechaSalida ? String(payload.fechaSalida) : undefined,
    rutaId: payload.rutaId ? Number(payload.rutaId) : undefined,
    operadorId: payload.operadorId ? Number(payload.operadorId) : undefined,
    unidadId: payload.unidadId ? Number(payload.unidadId) : undefined,
    estatus: "programado",
    createdAt: new Date().toISOString(),
  };

  db.envios.push(envio);
  return NextResponse.json(envio, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ items: db.envios, total: db.envios.length });
}
