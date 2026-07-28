import { NextResponse } from "next/server";

import { adminClient, dateValue, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await adminClient()
    .from("cobranza_documentos")
    .select("*")
    .order("fecha_vencimiento", { ascending: true });
  if (error) return supabaseError(error);
  const items = data.map((d) => ({
    document: d.documento,
    customer: d.cliente,
    zone: d.zona ?? "",
    seller: d.vendedor ?? "",
    balance: numberValue(d.saldo),
    dueDate: dateValue(d.fecha_vencimiento) ?? "",
  }));
  return NextResponse.json({ items, total: items.length });
}
