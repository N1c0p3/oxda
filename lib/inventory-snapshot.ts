import inventoryData from "@/inventario_xlsx_extraido.json";
import salesData from "@/public/data/ventas_mensual.json";
import predictionsData from "@/public/data/predicciones.json";

type RawWarehouse = {
  hoja: string;
  productos: Array<{ codigo?: unknown; descripcion?: unknown; inventario?: unknown }>;
};
type RawInventoryData = {
  archivo?: unknown;
  fecha_corte?: unknown;
  almacenes: RawWarehouse[];
};
type SalesProduct = { codigoProducto?: unknown; nombreProducto?: unknown; nombreAlmacen?: unknown; unidades?: unknown; costoTotal?: unknown; promedioDiarioUnidades?: unknown };
type Prediction = { codigoProducto?: unknown; almacen?: unknown; demanda30Dias?: unknown };

const WAREHOUSE_ZONE: Record<string, string> = {
  "CANCÚN": "QR", "RESUMEN CDMX": "CS", FRIGARSA: "CS", FRESCO: "CS", MEXIDELI: "CS",
  ALFRIMEX: "CS", CANBELT: "CS", FRIJALISCO: "GDL", "RESUMEN LEÓN": "MEN VLP",
  BAJIO: "MEN VLP", "VULPES PAPAS": "MEN VLP", "BAJO CERO": "MAY VLP",
};

const SALES_WAREHOUSES: Record<string, string[]> = {
  "CANCÚN": ["CANCUN"], FRIGARSA: ["FRIGARSA-COVENTINA"], FRESCO: ["ESTADO DE MÉXICO"],
  MEXIDELI: ["MEXIDELI - CDMX"], CANBELT: ["CANBELT"], FRIJALISCO: ["FRIJALISCO - GDL"],
  BAJIO: ["KAIDA", "GUARDAMEX", "FRISACEL"], "VULPES PAPAS": ["VLPLEÓN VULPES"],
  "BAJO CERO": ["BAJO CERO - LEÓN."],
};
const DETAIL_WAREHOUSES = new Set(Object.keys(SALES_WAREHOUSES));

const snapshot = inventoryData as unknown as RawInventoryData;
const warehouses = snapshot.almacenes;
const sales = (salesData as unknown as { productWarehouse: SalesProduct[] }).productWarehouse;
const predictions = (predictionsData as unknown as { demandPredictions: Prediction[] }).demandPredictions;
const numeric = (value: unknown) => {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
};
const validCode = (value: string) => {
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9.-]{2,}$/.test(code) && !/^(TOTAL|RESUMEN|C[ÓO]DIGO|FRISACEL|GUARDAMEX)/.test(code);
};

export function inventorySnapshotProducts() {
  const rows = new Map<string, { code: string; product: string; zone: string; warehouse: string; units: number }>();
  warehouses.filter((warehouse) => DETAIL_WAREHOUSES.has(warehouse.hoja)).forEach((warehouse) => warehouse.productos.forEach((item) => {
    const code = String(item.codigo ?? "").trim().toUpperCase();
    const key = `${warehouse.hoja}|${code}`;
    if (!validCode(code)) return;
    const current = rows.get(key) ?? { code, product: "", zone: WAREHOUSE_ZONE[warehouse.hoja] ?? warehouse.hoja, warehouse: warehouse.hoja, units: 0 };
    current.product ||= String(item.descripcion ?? "").trim();
    current.units += numeric(item.inventario);
    rows.set(key, current);
  }));

  return [...rows.values()].map((row) => {
    const warehouseNames = SALES_WAREHOUSES[row.warehouse] ?? [];
    const matchingSales = sales.filter((item) =>
      String(item.codigoProducto ?? "").trim().toUpperCase() === row.code &&
      warehouseNames.includes(String(item.nombreAlmacen ?? "").trim().toUpperCase())
    );
    const units = matchingSales.reduce((sum, item) => sum + numeric(item.unidades), 0);
    const cost = matchingSales.reduce((sum, item) => sum + numeric(item.costoTotal), 0);
    const currentMonthlyDemand = matchingSales.reduce((sum, item) => sum + numeric(item.promedioDiarioUnidades) * 30, 0);
    const forecastMonthlyDemand = predictions
      .filter((item) => String(item.codigoProducto ?? "").trim().toUpperCase() === row.code && warehouseNames.includes(String(item.almacen ?? "").trim().toUpperCase()))
      .reduce((sum, item) => sum + numeric(item.demanda30Dias), 0);
    return {
      ...row,
      product: row.product || String(matchingSales[0]?.nombreProducto ?? "").trim() || "Producto sin descripción",
      lot: "No informado en corte",
      expiry: "",
      monthlyDemand: Math.round((forecastMonthlyDemand || currentMonthlyDemand) * 100) / 100,
      costBox: units ? Math.round((cost / units) * 100) / 100 : 0,
      inTransit: 0,
    };
  });
}

export const inventorySnapshotMeta = {
  cutOff: String(snapshot.fecha_corte ?? ""),
  source: String(snapshot.archivo ?? ""),
};
