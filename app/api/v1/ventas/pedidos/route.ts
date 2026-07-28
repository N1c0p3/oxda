import { NextRequest, NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

type PedidoItem = { productoId: number; productoNombre?: string; cantidad: number; precioUnitario: number; descuento?: number }; 

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

  const folio = `PED-${Date.now()}`;
  const client = adminClient();
  const { data: pedido, error: pedidoError } = await client.from("ventas_pedidos").insert({
    folio, cliente_id: Number(payload.clienteId), fecha_pedido: new Date().toISOString().slice(0, 10),
    fecha_compromiso: payload.fechaCompromiso ? String(payload.fechaCompromiso) : null, estatus: "pendiente",
    subtotal: Number(subtotal.toFixed(2)), impuestos: Number(impuestos.toFixed(2)), total: Number(total.toFixed(2)),
  }).select().single();
  if (pedidoError) return supabaseError(pedidoError);
  const { error: itemsError } = await client.from("ventas_pedidos_detalle").insert(items.map((item) => ({
    pedido_id: pedido.id, producto_id: Number(item.productoId), cantidad: Number(item.cantidad),
    precio_unitario: Number(item.precioUnitario), subtotal: Number((Number(item.cantidad) * Number(item.precioUnitario)).toFixed(2)),
  })));
  if (itemsError) return supabaseError(itemsError);
  return NextResponse.json({ id: pedido.id, clienteId: pedido.cliente_id, fechaCompromiso: pedido.fecha_compromiso ?? undefined,
    items, subtotal: numberValue(pedido.subtotal), impuestos: numberValue(pedido.impuestos), total: numberValue(pedido.total),
    estatus: pedido.estatus, createdAt: pedido.created_at }, { status: 201 });
}

export async function GET() {
  const { data, error } = await adminClient().from("ventas_pedidos").select("*, ventas_pedidos_detalle(*)").order("created_at", { ascending: false });
  if (error) return supabaseError(error);
  const items = data.map((pedido) => ({
    id: pedido.id, clienteId: pedido.cliente_id, fechaCompromiso: pedido.fecha_compromiso ?? undefined,
    items: pedido.ventas_pedidos_detalle.map((item: { producto_id: number; cantidad: unknown; precio_unitario: unknown }) => ({ productoId: item.producto_id, cantidad: numberValue(item.cantidad), precioUnitario: numberValue(item.precio_unitario) })),
    subtotal: numberValue(pedido.subtotal), impuestos: numberValue(pedido.impuestos), total: numberValue(pedido.total), estatus: pedido.estatus, createdAt: pedido.created_at,
  }));
  return NextResponse.json({ items, total: items.length });
}
