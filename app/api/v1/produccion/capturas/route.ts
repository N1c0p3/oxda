import { NextRequest, NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  if (payload.kgProcesado < 0 || payload.kgMerma < 0 || payload.minutosParo < 0) {
    return NextResponse.json({ error: "Valores negativos no permitidos" }, { status: 400 });
  }

  if (payload.kgMerma > payload.kgProcesado * 1.2) {
    return NextResponse.json({ error: "Merma fuera de rango permitido" }, { status: 400 });
  }

  const { data, error } = await adminClient().from("produccion_capturas").insert({
    orden_id: Number(payload.ordenId), user_id: Number(payload.userId), area_id: Number(payload.areaId),
    turno: String(payload.turno), kg_procesado: Number(payload.kgProcesado), kg_merma: Number(payload.kgMerma),
    minutos_paro: Number(payload.minutosParo), incidencia: payload.incidencia ? String(payload.incidencia) : null,
  }).select().single();
  if (error) return supabaseError(error);
  return NextResponse.json({ id: data.id, ordenId: data.orden_id, userId: data.user_id, areaId: data.area_id,
    turno: data.turno, kgProcesado: numberValue(data.kg_procesado), kgMerma: numberValue(data.kg_merma),
    minutosParo: data.minutos_paro, incidencia: data.incidencia ?? undefined, fechaHora: data.fecha_hora }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const turno = request.nextUrl.searchParams.get("turno");
  const areaIdParam = request.nextUrl.searchParams.get("areaId");
  const areaId = areaIdParam ? Number(areaIdParam) : undefined;

  let query = adminClient().from("produccion_capturas").select().order("fecha_hora", { ascending: false });
  if (turno) query = query.eq("turno", turno);
  if (areaId) query = query.eq("area_id", areaId);
  const { data, error } = await query;
  if (error) return supabaseError(error);
  const items = data.map((item) => ({ id: item.id, ordenId: item.orden_id, userId: item.user_id, areaId: item.area_id,
    turno: item.turno, kgProcesado: numberValue(item.kg_procesado), kgMerma: numberValue(item.kg_merma),
    minutosParo: item.minutos_paro, incidencia: item.incidencia ?? undefined, fechaHora: item.fecha_hora }));
  const totalProcesado = items.reduce((acc, item) => acc + item.kgProcesado, 0);
  const totalMerma = items.reduce((acc, item) => acc + item.kgMerma, 0);
  return NextResponse.json({ items, resumen: { registros: items.length, kgProcesado: Number(totalProcesado.toFixed(2)),
    kgMerma: Number(totalMerma.toFixed(2)), mermaPct: Number((totalProcesado ? totalMerma / totalProcesado * 100 : 0).toFixed(2)) } });
}
