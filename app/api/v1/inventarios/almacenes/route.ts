import { NextResponse } from "next/server";

import { inventorySnapshotMeta, inventorySnapshotProducts } from "@/lib/inventory-snapshot";
import { inventoryStatus } from "@/lib/oxda-business-rules";

export const dynamic = "force-dynamic";

export async function GET() {
  const warehouses = new Map<string, {
    almacen: string;
    valor: number;
    cajas: number;
    ventasMes: number;
    llegadas: number;
  }>();

  inventorySnapshotProducts().forEach((product) => {
    const current = warehouses.get(product.warehouse) ?? {
      almacen: product.warehouse,
      valor: 0,
      cajas: 0,
      ventasMes: 0,
      llegadas: 0,
    };
    current.valor += product.units * product.costBox;
    current.cajas += product.units;
    current.ventasMes += product.monthlyDemand;
    current.llegadas += product.inTransit;
    warehouses.set(product.warehouse, current);
  });

  const items = [...warehouses.values()]
    .map((warehouse) => {
      const cobertura = warehouse.ventasMes > 0 ? warehouse.cajas / warehouse.ventasMes : 0;
      return {
        ...warehouse,
        valor: Math.round(warehouse.valor * 100) / 100,
        cajas: Math.round(warehouse.cajas * 100) / 100,
        costoProm: warehouse.cajas > 0 ? Math.round(warehouse.valor / warehouse.cajas * 100) / 100 : 0,
        ventasMes: Math.round(warehouse.ventasMes * 100) / 100,
        llegadas: Math.round(warehouse.llegadas * 100) / 100,
        ventasEst: Math.round(warehouse.ventasMes * 100) / 100,
        cobertura: Math.round(cobertura * 100) / 100,
        status: warehouse.ventasMes > 0 ? inventoryStatus(cobertura) : "Sin movimiento",
      };
    })
    .sort((a, b) => b.cajas - a.cajas);

  return NextResponse.json({ items, total: items.length, source: inventorySnapshotMeta });
}
