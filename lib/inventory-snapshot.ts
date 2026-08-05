import inventoryData from "@/inventario_xlsx_extraido.json";
import salesData from "@/public/data/ventas_mensual.json";

type RawWarehouse = {
  hoja: string;
  productos: Array<{ codigo?: unknown; descripcion?: unknown; inv_mayo?: unknown }>;
};
type SalesProduct = { codigoProducto?: unknown; nombreProducto?: unknown; unidades?: unknown; costoTotal?: unknown };

const WAREHOUSE_ZONE: Record<string, string> = {
  "CANCÚN": "QR", "RESUMEN CDMX": "CS", FRIGARSA: "CS", FRESCO: "CS", MEXIDELI: "CS",
  ALFRIMEX: "CS", CANBELT: "CS", FRIJALISCO: "GDL", "RESUMEN LEÓN": "MEN VLP",
  "VULPES PAPAS": "MEN VLP", "BAJO CERO": "MAY VLP",
};

const warehouses = (inventoryData as unknown as { almacenes: RawWarehouse[] }).almacenes;
const sales = (salesData as unknown as { productWarehouse: SalesProduct[] }).productWarehouse;
const numeric = (value: unknown) => {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
};
const validCode = (value: string) => {
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9.-]{2,}$/.test(code) && !/^(TOTAL|RESUMEN|C[ÓO]DIGO)/.test(code);
};

export function inventorySnapshotProducts() {
  const salesByCode = new Map<string, { name: string; units: number; cost: number }>();
  sales.forEach((item) => {
    const code = String(item.codigoProducto ?? "").trim().toUpperCase();
    if (!validCode(code)) return;
    const current = salesByCode.get(code) ?? { name: "", units: 0, cost: 0 };
    current.name ||= String(item.nombreProducto ?? "").trim();
    current.units += numeric(item.unidades);
    current.cost += numeric(item.costoTotal);
    salesByCode.set(code, current);
  });

  const seen = new Set<string>();
  return warehouses.flatMap((warehouse) => warehouse.productos.flatMap((item) => {
    const code = String(item.codigo ?? "").trim().toUpperCase();
    const key = `${warehouse.hoja}|${code}`;
    if (!validCode(code) || seen.has(key)) return [];
    seen.add(key);
    const salesItem = salesByCode.get(code);
    return [{
      code,
      product: String(item.descripcion ?? "").trim() || salesItem?.name || "Producto sin descripción",
      zone: WAREHOUSE_ZONE[warehouse.hoja] ?? warehouse.hoja,
      warehouse: warehouse.hoja,
      lot: "No informado en corte",
      expiry: "",
      units: numeric(item.inv_mayo),
      monthlyDemand: salesItem ? Math.round((salesItem.units / 6) * 100) / 100 : 0,
      costBox: salesItem?.units ? Math.round((salesItem.cost / salesItem.units) * 100) / 100 : 0,
      inTransit: 0,
    }];
  }));
}

export const inventorySnapshotMeta = { cutOff: "2026-05-31", source: "INVENTARIOS OXDA MAYO 2026.xlsx" };
