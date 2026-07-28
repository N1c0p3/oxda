import { NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await adminClient()
    .from("presupuestos_division")
    .select("*")
    .order("id", { ascending: true });
  if (error) return supabaseError(error);
  const items = data.map((d) => ({
    division: d.division,
    presupuesto: numberValue(d.presupuesto),
    real: numberValue(d.real),
    diferencia: numberValue(d.diferencia),
    avance: numberValue(d.avance),
  }));
  return NextResponse.json({ items, total: items.length });
}
