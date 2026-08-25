import { NextResponse } from "next/server";

import { adminClient, dateValue, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await adminClient()
    .from("inventarios_transito")
    .select("*")
    .order("eta", { ascending: true });
  if (error) return supabaseError(error);

  const grouped: Record<string, number> = {};
  data.forEach((t) => {
    grouped[t.almacen_destino] = (grouped[t.almacen_destino] ?? 0) + Number(t.cajas);
  });

  const items = data.map((t) => ({
    id: String(t.id),
    almacenDestino: t.almacen_destino,
    producto: t.producto,
    cajas: numberValue(t.cajas),
    valor: numberValue(t.valor),
    origen: t.origen ?? "",
    eta: dateValue(t.eta) ?? "",
    estado: t.estado ?? "",
    transportista: t.transportista ?? "",
  }));

  const porAlmacen = Object.entries(grouped).map(([almacen, cajas]) => ({ almacen, cajas, valor: 0 }));

  return NextResponse.json({ items, total: items.length, porAlmacen });
}
