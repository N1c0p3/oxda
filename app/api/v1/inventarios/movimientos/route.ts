import { NextRequest, NextResponse } from "next/server";

import { db, type InventarioMovimiento } from "@/lib/demo-db";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  if (!payload.tipoMovimiento || !payload.productoId || !payload.cantidad || !payload.unidad || !payload.userId) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  if (Number(payload.cantidad) <= 0) {
    return NextResponse.json({ error: "La cantidad debe ser mayor a cero" }, { status: 400 });
  }

  const tipoMovimiento = String(payload.tipoMovimiento) as InventarioMovimiento["tipoMovimiento"];

  const registro: InventarioMovimiento = {
    id: db.movimientos.length + 1,
    fecha: payload.fecha ? new Date(payload.fecha).toISOString() : new Date().toISOString(),
    tipoMovimiento,
    productoId: Number(payload.productoId),
    productoNombre: String(payload.productoNombre ?? ""),
    loteId: payload.loteId ? String(payload.loteId) : undefined,
    almacenOrigenId: payload.almacenOrigenId ? Number(payload.almacenOrigenId) : undefined,
    almacenDestinoId: payload.almacenDestinoId ? Number(payload.almacenDestinoId) : undefined,
    cantidad: Number(payload.cantidad),
    unidad: String(payload.unidad),
    motivo: payload.motivo ? String(payload.motivo) : undefined,
    userId: Number(payload.userId),
  };

  db.movimientos.push(registro);
  return NextResponse.json(registro, { status: 201 });
}
