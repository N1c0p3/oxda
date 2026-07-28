import { NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await adminClient()
    .from("productos")
    .select("*, unidades_medida(nombre)")
    .order("id", { ascending: true });
  if (error) return supabaseError(error);
  const items = data.map((p) => ({
    id: p.id,
    code: p.sku,
    product: p.nombre,
    category: p.categoria ?? "",
    kgBox: numberValue(p.kg_caja),
    costBox: numberValue(p.costo_estandar),
    price: numberValue(p.precio_venta),
    unidad: p.unidades_medida?.nombre ?? "",
  }));
  return NextResponse.json({ items, total: items.length });
}

export async function PATCH(request: Request) {
  const payload = await request.json();
  if (!payload.code) {
    return NextResponse.json({ error: "SKU es obligatorio" }, { status: 400 });
  }
  const { data, error } = await adminClient()
    .from("productos")
    .update({ precio_venta: Number(payload.price) })
    .eq("sku", String(payload.code))
    .select()
    .single();
  if (error) return supabaseError(error);
  return NextResponse.json({
    id: data.id,
    code: data.sku,
    product: data.nombre,
    category: data.categoria ?? "",
    kgBox: numberValue(data.kg_caja),
    costBox: numberValue(data.costo_estandar),
    price: numberValue(data.precio_venta),
  });
}
