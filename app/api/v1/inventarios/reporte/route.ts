import { NextRequest, NextResponse } from "next/server";

import { adminClient, dateValue, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const [productsRes, movementsRes, rotationRes] = await Promise.all([
    adminClient().from("inventario_reporte_productos").select("*").order("id", { ascending: true }),
    adminClient().from("inventario_reporte_movimientos").select("*").order("date", { ascending: false }),
    adminClient().from("inventario_rotacion").select("*").order("id", { ascending: true }),
  ]);

  if (productsRes.error) return supabaseError(productsRes.error);
  if (movementsRes.error) return supabaseError(movementsRes.error);
  if (rotationRes.error) return supabaseError(rotationRes.error);

  const products = productsRes.data.map((p) => ({
    code: p.code,
    product: p.product,
    zone: p.zone,
    warehouse: p.warehouse,
    lot: p.lot,
    expiry: dateValue(p.expiry) ?? "",
    units: numberValue(p.units),
    monthlyDemand: numberValue(p.monthly_demand),
    costBox: numberValue(p.cost_box),
    inTransit: numberValue(p.in_transit),
  }));

  const movements = movementsRes.data.map((m) => ({
    id: String(m.id),
    date: dateValue(m.date) ?? "",
    type: m.type,
    zone: m.zone,
    warehouse: m.warehouse,
    code: m.code,
    product: m.product,
    lot: m.lot,
    units: numberValue(m.units),
    reference: m.reference,
  }));

  const rotationHistory = rotationRes.data
    .filter((r) => r.tipo === "historico")
    .map((r) => ({ month: r.periodo, GDL: numberValue(r.gdl), QR: numberValue(r.qr), CS: numberValue(r.cs), "MEN VLP": numberValue(r.men_vlp), "MAY VLP": numberValue(r.may_vlp), consolidated: numberValue(r.consolidated) }));

  const rotationWeekly = rotationRes.data
    .filter((r) => r.tipo === "semanal")
    .map((r) => ({ date: `2026-${r.periodo.replace(" ", "-")}`, month: r.periodo, GDL: numberValue(r.gdl), QR: numberValue(r.qr), CS: numberValue(r.cs), "MEN VLP": numberValue(r.men_vlp), "MAY VLP": numberValue(r.may_vlp), consolidated: numberValue(r.consolidated) }));

  return NextResponse.json({ products, movements, rotationHistory, rotationWeekly });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (!payload.date || !payload.type || !payload.code || !payload.units || !payload.reference) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  const productRes = await adminClient()
    .from("inventario_reporte_productos")
    .select("*")
    .eq("code", String(payload.code))
    .single();
  if (productRes.error) return supabaseError(productRes.error);
  const p = productRes.data;
  const { data, error } = await adminClient()
    .from("inventario_reporte_movimientos")
    .insert({
      date: String(payload.date),
      type: String(payload.type),
      zone: p.zone,
      warehouse: p.warehouse,
      code: p.code,
      product: p.product,
      lot: p.lot,
      units: Number(payload.units),
      reference: String(payload.reference),
    })
    .select()
    .single();
  if (error) return supabaseError(error);
  return NextResponse.json({
    id: String(data.id),
    date: dateValue(data.date) ?? "",
    type: data.type,
    zone: data.zone,
    warehouse: data.warehouse,
    code: data.code,
    product: data.product,
    lot: data.lot,
    units: numberValue(data.units),
    reference: data.reference,
  }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const payload = await request.json();
  if (!payload.code || !payload.expiry) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  const { error } = await adminClient()
    .from("inventario_reporte_productos")
    .update({ expiry: String(payload.expiry) })
    .eq("code", String(payload.code));
  if (error) return supabaseError(error);
  return NextResponse.json({ ok: true });
}
