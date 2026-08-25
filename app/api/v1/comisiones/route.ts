import { NextRequest, NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await adminClient()
    .from("comisiones")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return supabaseError(error);
  const items = data.map((item) => ({
    id: String(item.id),
    seller: item.vendedor,
    zone: item.zona ?? "",
    sale: numberValue(item.venta),
    rate: numberValue(item.tasa),
    status: item.estatus as "Por autorizar" | "Programada" | "Pagada",
    paymentDate: item.fecha_pago ?? "",
  }));
  return NextResponse.json({ items, total: items.length });
}

export async function PATCH(request: NextRequest) {
  const payload = await request.json();
  if (!payload.id) {
    return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });
  }
  const { data, error } = await adminClient()
    .from("comisiones")
    .update({
      tasa: payload.rate !== undefined ? Number(payload.rate) : undefined,
      estatus: payload.status ?? undefined,
      fecha_pago: payload.paymentDate ? String(payload.paymentDate) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", Number(payload.id))
    .select()
    .single();
  if (error) return supabaseError(error);
  return NextResponse.json({
    id: String(data.id),
    seller: data.vendedor,
    zone: data.zona ?? "",
    sale: numberValue(data.venta),
    rate: numberValue(data.tasa),
    status: data.estatus as "Por autorizar" | "Programada" | "Pagada",
    paymentDate: data.fecha_pago ?? "",
  });
}
