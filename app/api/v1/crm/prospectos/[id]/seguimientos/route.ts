import { NextRequest, NextResponse } from "next/server";

import { adminClient, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const prospectoId = Number(params.id);
  const payload = await request.json();

  const { data, error } = await adminClient()
    .from("crm_seguimientos")
    .insert({
      prospecto_id: prospectoId,
      fecha: payload.fecha ? String(payload.fecha) : new Date().toISOString().slice(0, 10),
      tipo: String(payload.tipo),
      comentario: String(payload.comentario),
      proxima_accion: payload.proximaAccion ? String(payload.proximaAccion) : null,
      fecha_proxima: payload.fechaProxima ? String(payload.fechaProxima) : null,
    })
    .select()
    .single();
  if (error) return supabaseError(error);

  return NextResponse.json({
    id: String(data.id),
    fecha: data.fecha,
    tipo: data.tipo,
    comentario: data.comentario,
    proximaAccion: data.proxima_accion ?? "",
    fechaProxima: data.fecha_proxima ?? "",
  }, { status: 201 });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const prospectoId = Number(params.id);
  const seguimientoId = request.nextUrl.searchParams.get("segId");
  if (!seguimientoId) {
    return NextResponse.json({ error: "segId requerido" }, { status: 400 });
  }

  const { error } = await adminClient()
    .from("crm_seguimientos")
    .delete()
    .eq("id", Number(seguimientoId))
    .eq("prospecto_id", prospectoId);
  if (error) return supabaseError(error);

  return NextResponse.json({ ok: true });
}
