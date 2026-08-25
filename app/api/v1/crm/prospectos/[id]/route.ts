import { NextRequest, NextResponse } from "next/server";

import { adminClient, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

type CatalogProduct = { id: number; sku: string; nombre: string };

async function productInterestFromPayload(client: ReturnType<typeof adminClient>, value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const productId = Number(value);
  if (!Number.isInteger(productId) || productId <= 0) throw new Error("Producto de interés no válido");
  const { data, error } = await client
    .from("productos")
    .select("id, sku, nombre")
    .eq("id", productId)
    .eq("en_catalogo_precios", true)
    .eq("activo", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("El producto seleccionado no está disponible en el catálogo");
  const product = data as CatalogProduct;
  return { id: product.id, label: `${product.sku} · ${product.nombre}` };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = params.id;
  const payload = await request.json();
  const client = adminClient();

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
  try {
    const productInterest = await productInterestFromPayload(client, payload.productoInteresId);
    if (productInterest !== undefined) {
      updateData.producto_interes_id = productInterest?.id ?? null;
      updateData.producto_interes = productInterest?.label ?? null;
    } else if (payload.productoInteres !== undefined) {
      updateData.producto_interes = payload.productoInteres ? String(payload.productoInteres) : null;
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Producto de interés no válido" }, { status: 400 });
  }
  if (payload.zona !== undefined) updateData.zona = String(payload.zona);
  if (payload.etapa !== undefined) updateData.etapa = String(payload.etapa);
  if (payload.notas !== undefined) updateData.notas = payload.notas ? String(payload.notas) : null;
  updateData.updated_at = new Date().toISOString();

  const { error } = await client.from("crm_prospectos").update(updateData).eq("id", Number(id));
  if (error) return supabaseError(error);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { error } = await adminClient().from("crm_prospectos").delete().eq("id", Number(id));
  if (error) return supabaseError(error);
  return NextResponse.json({ ok: true });
}
