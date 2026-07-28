import { NextRequest, NextResponse } from "next/server";

import { adminClient, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = params.id;
  const payload = await request.json();

  const updateData: Record<string, unknown> = {};
  if (payload.fecha !== undefined) updateData.fecha = String(payload.fecha);
  if (payload.asesor !== undefined) updateData.asesor = String(payload.asesor);
  if (payload.canal !== undefined) updateData.canal = String(payload.canal);
  if (payload.nombreProspecto !== undefined) updateData.nombre_prospecto = String(payload.nombreProspecto);
  if (payload.cargoProspecto !== undefined) updateData.cargo_prospecto = payload.cargoProspecto ? String(payload.cargoProspecto) : null;
  if (payload.nombreNegocio !== undefined) updateData.nombre_negocio = String(payload.nombreNegocio);
  if (payload.municipio !== undefined) updateData.municipio = payload.municipio ? String(payload.municipio) : null;
  if (payload.estado !== undefined) updateData.estado = payload.estado ? String(payload.estado) : null;
  if (payload.contacto1 !== undefined) updateData.contacto1 = payload.contacto1 ? String(payload.contacto1) : null;
  if (payload.contacto2 !== undefined) updateData.contacto2 = payload.contacto2 ? String(payload.contacto2) : null;
  if (payload.correo !== undefined) updateData.correo = payload.correo ? String(payload.correo) : null;
  if (payload.productoInteres !== undefined) updateData.producto_interes = payload.productoInteres ? String(payload.productoInteres) : null;
  if (payload.zona !== undefined) updateData.zona = String(payload.zona);
  if (payload.etapa !== undefined) updateData.etapa = String(payload.etapa);
  if (payload.notas !== undefined) updateData.notas = payload.notas ? String(payload.notas) : null;
  updateData.updated_at = new Date().toISOString();

  const { error } = await adminClient().from("crm_prospectos").update(updateData).eq("id", Number(id));
  if (error) return supabaseError(error);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { error } = await adminClient().from("crm_prospectos").delete().eq("id", Number(id));
  if (error) return supabaseError(error);
  return NextResponse.json({ ok: true });
}
