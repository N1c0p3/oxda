import { NextRequest, NextResponse } from "next/server";

import { adminClient, dateValue, numberValue, supabaseError } from "@/lib/supabase/api";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  if (!payload.clienteId || !payload.nombre || !payload.etapa) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const probabilidad = Number(payload.probabilidad ?? 0);
  const montoEstimado = Number(payload.montoEstimado ?? 0);
  if (probabilidad < 0 || probabilidad > 100 || montoEstimado < 0) {
    return NextResponse.json({ error: "Datos fuera de rango" }, { status: 400 });
  }

  const { data, error } = await adminClient()
    .from("crm_oportunidades")
    .insert({
      cliente_id: Number(payload.clienteId),
      responsable_id: Number(payload.vendedorId),
      nombre: String(payload.nombre),
      etapa: String(payload.etapa),
      probabilidad,
      monto_estimado: montoEstimado,
      fecha_cierre_estimada: payload.cierreEstimado ? String(payload.cierreEstimado) : null,
    })
    .select()
    .single();

  if (error) return supabaseError(error);
  return NextResponse.json({
    id: data.id,
    clienteId: data.cliente_id,
    vendedorId: data.responsable_id,
    nombre: data.nombre,
    etapa: data.etapa,
    probabilidad: numberValue(data.probabilidad),
    montoEstimado: numberValue(data.monto_estimado),
    cierreEstimado: dateValue(data.fecha_cierre_estimada),
    createdAt: data.created_at,
  }, { status: 201 });
}

export async function GET() {
  const { data, error } = await adminClient()
    .from("crm_oportunidades")
    .select("*, clientes(nombre_comercial), usuarios(nombre)")
    .order("created_at", { ascending: false });
  if (error) return supabaseError(error);
  const items = data.map((item) => ({
    id: item.id,
    clienteId: item.cliente_id,
    cliente: item.clientes?.nombre_comercial ?? String(item.cliente_id),
    vendedorId: item.responsable_id,
    vendedor: item.usuarios?.nombre ?? String(item.responsable_id),
    nombre: item.nombre,
    etapa: item.etapa,
    probabilidad: numberValue(item.probabilidad),
    montoEstimado: numberValue(item.monto_estimado),
    cierreEstimado: dateValue(item.fecha_cierre_estimada),
    createdAt: item.created_at,
  }));
  return NextResponse.json({ items, total: items.length });
}
