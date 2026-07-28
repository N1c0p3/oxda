import { NextRequest, NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export async function GET() {
  const { data, error } = await adminClient()
    .from("inventario_movimientos")
    .select("*, productos(nombre), unidades_medida(nombre), almacen_origen:almacen_origen_id(nombre), almacen_destino:almacen_destino_id(nombre)")
    .order("fecha", { ascending: false });
  if (error) return supabaseError(error);
  const items = data.map((m) => ({
    id: m.id,
    fecha: m.fecha,
    tipoMovimiento: m.tipo_movimiento,
    productoId: m.producto_id,
    productoNombre: m.productos?.nombre ?? String(m.producto_id),
    loteId: m.lote_id ?? undefined,
    almacenOrigenId: m.almacen_origen_id ?? undefined,
    almacenOrigenNombre: m.almacen_origen?.nombre,
    almacenDestinoId: m.almacen_destino_id ?? undefined,
    almacenDestinoNombre: m.almacen_destino?.nombre,
    cantidad: numberValue(m.cantidad),
    unidad: m.unidades_medida?.nombre ?? "",
    motivo: m.motivo ?? undefined,
    userId: m.usuario_id,
  }));
  return NextResponse.json({ items, total: items.length });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();

  if (!payload.tipoMovimiento || !payload.productoId || !payload.cantidad || !payload.unidad || !payload.userId) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  if (Number(payload.cantidad) <= 0) {
    return NextResponse.json({ error: "La cantidad debe ser mayor a cero" }, { status: 400 });
  }

  const { data, error } = await adminClient().from("inventario_movimientos").insert({
    fecha: payload.fecha ? new Date(payload.fecha).toISOString() : new Date().toISOString(),
    tipo_movimiento: String(payload.tipoMovimiento), producto_id: Number(payload.productoId),
    lote_id: payload.loteId ? Number(payload.loteId) : null, almacen_origen_id: payload.almacenOrigenId ? Number(payload.almacenOrigenId) : null,
    almacen_destino_id: payload.almacenDestinoId ? Number(payload.almacenDestinoId) : null, cantidad: Number(payload.cantidad),
    unidad_id: Number(payload.unidad), motivo: payload.motivo ? String(payload.motivo) : null, usuario_id: Number(payload.userId),
  }).select("*, productos(nombre), unidades_medida(nombre)").single();
  if (error) return supabaseError(error);
  return NextResponse.json({ id: data.id, fecha: data.fecha, tipoMovimiento: data.tipo_movimiento, productoId: data.producto_id,
    productoNombre: data.productos?.nombre, loteId: data.lote_id ? String(data.lote_id) : undefined,
    almacenOrigenId: data.almacen_origen_id, almacenDestinoId: data.almacen_destino_id, cantidad: numberValue(data.cantidad),
    unidad: data.unidades_medida?.nombre ?? "", motivo: data.motivo ?? undefined, userId: data.usuario_id }, { status: 201 });
}
