import { NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await adminClient()
    .from("dashboard_zona_metricas")
    .select("*")
    .order("id", { ascending: true });
  if (error) return supabaseError(error);

  const inventoryByZone: Record<string, { units: number; rotation: number; critical: number; transit: number; transitValue: number }> = {};
  const receivablesByZone: Record<string, { total: number; overdue: number; dueSoon: number }> = {};

  data.forEach((row) => {
    inventoryByZone[row.zona] = {
      units: numberValue(row.inventory_units),
      rotation: numberValue(row.inventory_rotation),
      critical: numberValue(row.inventory_critical),
      transit: numberValue(row.inventory_transit),
      transitValue: numberValue(row.inventory_transit_value),
    };
    receivablesByZone[row.zona] = {
      total: numberValue(row.receivables_total),
      overdue: numberValue(row.receivables_overdue),
      dueSoon: numberValue(row.receivables_due_soon),
    };
  });

  return NextResponse.json({ inventoryByZone, receivablesByZone });
}
