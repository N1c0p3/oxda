import { NextRequest, NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export async function GET(request: NextRequest) {
  const productoIdParam = request.nextUrl.searchParams.get("productoId");
  const productoId = productoIdParam ? Number(productoIdParam) : undefined;

  let query = adminClient().from("inventario_movimientos").select("*, productos(nombre), unidades_medida(nombre)").order("fecha", { ascending: false });
  if (productoId) query = query.eq("producto_id", productoId);
  const { data, error } = await query;
  if (error) return supabaseError(error);
  const items = data.map((item) => ({
    id: item.id, fecha: item.fecha, tipoMovimiento: item.tipo_movimiento, productoId: item.producto_id,
    productoNombre: item.productos?.nombre, loteId: item.lote_id ? String(item.lote_id) : undefined,
    almacenOrigenId: item.almacen_origen_id, almacenDestinoId: item.almacen_destino_id,
    cantidad: numberValue(item.cantidad), unidad: item.unidades_medida?.nombre ?? "", motivo: item.motivo ?? undefined,
    userId: item.usuario_id,
  }));
  return NextResponse.json({ items, total: items.length });
}
