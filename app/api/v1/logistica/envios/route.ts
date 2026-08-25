import { NextRequest, NextResponse } from "next/server";

import { adminClient, supabaseError } from "@/lib/supabase/api";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const pedidoId = Number(payload.pedidoId);

  if (!pedidoId) {
    return NextResponse.json({ error: "pedidoId es obligatorio" }, { status: 400 });
  }

  const client = adminClient();
  const { data: pedido, error: pedidoError } = await client.from("ventas_pedidos").select("id").eq("id", pedidoId).single();
  if (pedidoError || !pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  const { data, error } = await client.from("logistica_envios").insert({
    pedido_id: pedidoId, fecha_salida: payload.fechaSalida ? String(payload.fechaSalida) : null,
    ruta_id: payload.rutaId ? Number(payload.rutaId) : null, operador_id: payload.operadorId ? Number(payload.operadorId) : null,
    unidad_id: payload.unidadId ? Number(payload.unidadId) : null, estatus: "programado",
  }).select().single();
  if (error) return supabaseError(error);
  return NextResponse.json({ id: data.id, pedidoId: data.pedido_id, fechaSalida: data.fecha_salida ?? undefined, rutaId: data.ruta_id ?? undefined,
    operadorId: data.operador_id ?? undefined, unidadId: data.unidad_id ?? undefined, estatus: data.estatus, createdAt: data.created_at }, { status: 201 });
}

export async function GET() {
  const { data, error } = await adminClient().from("logistica_envios").select().order("created_at", { ascending: false });
  if (error) return supabaseError(error);
  const items = data.map((item) => ({ id: item.id, pedidoId: item.pedido_id, fechaSalida: item.fecha_salida ?? undefined,
    fechaEntrega: item.fecha_entrega ?? undefined, rutaId: item.ruta_id ?? undefined, operadorId: item.operador_id ?? undefined,
    unidadId: item.unidad_id ?? undefined, estatus: item.estatus, createdAt: item.created_at }));
  return NextResponse.json({ items, total: items.length });
}
