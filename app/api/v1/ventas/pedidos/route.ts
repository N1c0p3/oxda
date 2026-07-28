import { NextRequest, NextResponse } from "next/server";

import { db, type Pedido, type PedidoItem } from "@/lib/demo-db";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const items = (payload.items ?? []) as PedidoItem[];

  if (!payload.clienteId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Pedido invalido" }, { status: 400 });
  }

  for (const item of items) {
    if (Number(item.cantidad) <= 0 || Number(item.precioUnitario) < 0) {
      return NextResponse.json({ error: "Items fuera de rango" }, { status: 400 });
    }
  }

  const subtotal = items.reduce((acc, item) => acc + Number(item.cantidad) * Number(item.precioUnitario), 0);
  const impuestos = subtotal * 0.16;
  const total = subtotal + impuestos;

  const pedido: Pedido = {
    id: db.pedidos.length + 1,
    clienteId: Number(payload.clienteId),
    clienteNombre: String(payload.clienteNombre ?? ""),
    fechaCompromiso: payload.fechaCompromiso ? String(payload.fechaCompromiso) : undefined,
    items: items.map((item) => ({
      productoId: Number(item.productoId),
      productoNombre: String(item.productoNombre ?? ""),
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precioUnitario),
      descuento: item.descuento ? Number(item.descuento) : undefined,
    })),
    comentarios: payload.comentarios ? String(payload.comentarios) : undefined,
    subtotal: Number(subtotal.toFixed(2)),
    descuento: 0,
    impuestos: Number(impuestos.toFixed(2)),
    total: Number(total.toFixed(2)),
    estatus: "pendiente",
    metodoPago: String(payload.metodoPago ?? "por definir"),
    vendedorId: Number(payload.vendedorId ?? 0),
    createdAt: new Date().toISOString(),
  };

  db.pedidos.push(pedido);
  return NextResponse.json(pedido, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ items: db.pedidos, total: db.pedidos.length });
}
