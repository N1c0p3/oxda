import { NextResponse } from "next/server";

import { adminClient, numberValue, supabaseError } from "@/lib/supabase/api";
import { inventorySnapshotProducts } from "@/lib/inventory-snapshot";
import { inventoryStatus } from "@/lib/oxda-business-rules";
import { commercialZoneFromSource } from "@/lib/commercial-catalog";

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
    const zone = commercialZoneFromSource(item.zone);
    if (!zone || zone === "TODAS" || zone === "MUESTRAS") return;
    const current = inventoryByZone[zone] ?? { units: 0, rotation: 0, critical: 0, transit: 0, transitValue: 0 };
    current.units += item.units;
    current.transit += item.inTransit;
    current.transitValue += item.inTransit * item.costBox;
    if (item.monthlyDemand > 0) {
      demandByZone[zone] = (demandByZone[zone] ?? 0) + item.monthlyDemand;
      if (inventoryStatus(item.units / item.monthlyDemand) === "Crítico") current.critical += 1;
    }
    inventoryByZone[zone] = current;
  });
  Object.entries(inventoryByZone).forEach(([zone, item]) => {
    item.rotation = Number(((demandByZone[zone] ?? 0) / Math.max(item.units, 1)).toFixed(2));
  });

  data.forEach((row) => {
    const zone = commercialZoneFromSource(row.zona);
    if (!zone || zone === "TODAS" || zone === "MUESTRAS") return;
    const current = receivablesByZone[zone] ?? { total: 0, overdue: 0, dueSoon: 0 };
    current.total += numberValue(row.receivables_total);
    current.overdue += numberValue(row.receivables_overdue);
    current.dueSoon += numberValue(row.receivables_due_soon);
    receivablesByZone[zone] = current;
  });

  return NextResponse.json({ inventoryByZone, receivablesByZone });
}
