import { NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";
import { inventorySnapshotProducts } from "@/lib/inventory-snapshot";
import { inventoryStatus } from "@/lib/oxda-business-rules";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await adminClient()
    .from("dashboard_zona_metricas")
    .select("*")
    .order("id", { ascending: true });
  if (error) return supabaseError(error);

  const inventoryByZone: Record<string, { units: number; rotation: number; critical: number; transit: number; transitValue: number }> = {};
  const demandByZone: Record<string, number> = {};
  const receivablesByZone: Record<string, { total: number; overdue: number; dueSoon: number }> = {};

  inventorySnapshotProducts().forEach((item) => {
    const current = inventoryByZone[item.zone] ?? { units: 0, rotation: 0, critical: 0, transit: 0, transitValue: 0 };
    current.units += item.units;
    current.transit += item.inTransit;
    current.transitValue += item.inTransit * item.costBox;
    if (item.monthlyDemand > 0) {
      demandByZone[item.zone] = (demandByZone[item.zone] ?? 0) + item.monthlyDemand;
      if (inventoryStatus(item.units / item.monthlyDemand) === "Crítico") current.critical += 1;
    }
    inventoryByZone[item.zone] = current;
  });
  Object.entries(inventoryByZone).forEach(([zone, item]) => {
    item.rotation = Number(((demandByZone[zone] ?? 0) / Math.max(item.units, 1)).toFixed(2));
  });

  data.forEach((row) => {
    receivablesByZone[row.zona] = {
      total: numberValue(row.receivables_total),
      overdue: numberValue(row.receivables_overdue),
      dueSoon: numberValue(row.receivables_due_soon),
    };
  });

  return NextResponse.json({ inventoryByZone, receivablesByZone });
}
