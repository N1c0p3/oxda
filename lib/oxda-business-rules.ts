export type InventoryStatus = "Crítico" | "Óptimo" | "Exceso";

export function inventoryStatus(coverageMonths: number): InventoryStatus {
  if (coverageMonths < 1.5) return "Crítico";
  if (coverageMonths < 2) return "Óptimo";
  return "Exceso";
}

export const FORMULA_CATALOG = [
  {
    metric: "Venta neta",
    formula: "Σ Neto de documentos de facturación",
    source: "Reporte de Venta · campo Neto",
    status: "validada",
  },
  {
    metric: "Costo",
    formula: "Σ Costo total de los renglones facturados",
    source: "Reporte de Venta · campo Costo total",
    status: "validada",
  },
  {
    metric: "Margen",
    formula: "Venta neta − costo total",
    source: "Se contrasta contra el campo Margen",
    status: "validada",
  },
  {
    metric: "Margen %",
    formula: "Margen ÷ venta neta × 100",
    source: "Cálculo ponderado; no promedio de porcentajes",
    status: "corregida",
  },
  {
    metric: "Rotación mensual",
    formula: "Unidades vendidas ÷ días del periodo × 30",
    source: "Facturación por producto",
    status: "validada",
  },
  {
    metric: "Cobertura",
    formula: "Unidades disponibles ÷ consumo mensual",
    source: "Inventario y venta mensual",
    status: "validada",
  },
  {
    metric: "Participación inventario",
    formula: "Unidades del producto ÷ unidades totales × 100",
    source: "Existencias físicas",
    status: "corregida",
  },
  {
    metric: "Factor de tendencia",
    formula: "Venta facturada del periodo ÷ venta facturada del periodo anterior",
    source: "Fecha y neto de facturación",
    status: "validada",
  },
  {
    metric: "MCP",
    formula: "Pendiente de definición funcional aprobada",
    source: "No se sustituye por margen hasta confirmar la métrica",
    status: "pendiente",
  },
] as const;

export const MONTH_BUDGETS: Record<string, Record<string, number>> = {
  Ene: { GDL: 868336, QR: 640090, CS: 1224156, "CC KAIDA1": 624000, "CC KAIDA2": 636000, "MEN VLP": 1000000, "MAY VLP": 485000 },
  Feb: { GDL: 937996, QR: 723170, CS: 1236049, "CC KAIDA1": 636000, "CC KAIDA2": 636000, "MEN VLP": 680000, "MAY VLP": 583000 },
  Mar: { GDL: 1319014, QR: 676280, CS: 885795, "CC KAIDA1": 576000, "CC KAIDA2": 636000, "MEN VLP": 592919, "MAY VLP": 495170 },
  Abr: { GDL: 1239990, QR: 968530, CS: 798594, "CC KAIDA1": 600000, "CC KAIDA2": 600000, "MEN VLP": 760000, "MAY VLP": 550000 },
  May: { GDL: 976665, QR: 941850, CS: 727054, "CC CASTEL": 621000, "CC KAIDA1": 316800, "MEN VLP": 902885, "MAY VLP": 766144 },
};
