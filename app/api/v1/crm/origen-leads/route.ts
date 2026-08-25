import { NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await adminClient()
    .from("pipeline_origen_leads")
    .select("*")
    .order("id", { ascending: true });
  if (error) return supabaseError(error);
  const items = data.map((row) => ({ origen: row.origen, cantidad: row.cantidad, porcentaje: numberValue(row.porcentaje) }));
  return NextResponse.json({ items, total: items.length });
}
