import { NextRequest, NextResponse } from "next/server";

import { adminClient, supabaseError } from "@/lib/supabase/api";

export async function PATCH(request: NextRequest, context: { params: Promise<{ envioId: string }> }) {
  const { envioId } = await context.params;
  const payload = await request.json();

  if (!payload.estatus) {
    return NextResponse.json({ error: "estatus es obligatorio" }, { status: 400 });
  }

  const id = Number(envioId);
  const { data, error } = await adminClient().from("logistica_envios").update({ estatus: String(payload.estatus) }).eq("id", id).select().single();
  if (error) return supabaseError(error);
  return NextResponse.json({ id: data.id, pedidoId: data.pedido_id, fechaSalida: data.fecha_salida ?? undefined,
    fechaEntrega: data.fecha_entrega ?? undefined, rutaId: data.ruta_id ?? undefined, operadorId: data.operador_id ?? undefined,
    unidadId: data.unidad_id ?? undefined, estatus: data.estatus, createdAt: data.created_at });
}
