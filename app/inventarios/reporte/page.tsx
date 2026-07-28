"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  Boxes,
  Calculator,
  CalendarClock,
  Check,
  Download,
  Package,
  Pencil,
  Plus,
  Save,
  Ship,
  Warehouse,
} from "lucide-react";
import { AreaChartComponent, BarChartComponent, ChartCard, PieChartComponent, StatCard } from "@/components/charts";
import { useZone } from "@/components/zone-filter";
import { inventoryStatus } from "@/lib/oxda-business-rules";

type InventoryProduct = {
  code: string;
  product: string;
  zone: string;
  warehouse: string;
  lot: string;
  expiry: string;
  units: number;
  monthlyDemand: number;
  costBox: number;
  inTransit: number;
};

type InventoryMovement = {
  id: string;
  date: string;
  type: "Entrada" | "Salida" | "Transferencia" | "Ajuste";
  zone: string;
  warehouse: string;
  code: string;
  product: string;
  lot: string;
  units: number;
  reference: string;
};

type RotationRow = { month: string; GDL: number; QR: number; CS: number; "MEN VLP": number; "MAY VLP": number; consolidated: number; date?: string };

type ReporteData = {
  products: InventoryProduct[];
  movements: InventoryMovement[];
  rotationHistory: RotationRow[];
  rotationWeekly: RotationRow[];
};

const emptyData: ReporteData = { products: [], movements: [], rotationHistory: [], rotationWeekly: [] };

const money = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const number = (value: number) => value.toLocaleString("es-MX", { maximumFractionDigits: 1 });

export default function InventoryCenterPage() {
  const { zone } = useZone();
  const [tab, setTab] = useState<"general" | "desglose" | "movimientos" | "transito" | "calculadora">("general");
  const [data, setData] = useState<ReporteData>(emptyData);
  const { products, movements } = data;
  const [period, setPeriod] = useState<"semana" | "mes" | "personalizado">("mes");
  const [from, setFrom] = useState("2026-05-01");
  const [to, setTo] = useState("2026-05-31");
  const [warehouse, setWarehouse] = useState("TODOS");
  const [selectedCode, setSelectedCode] = useState("");
  const [targetMonths, setTargetMonths] = useState(1.5);
  const [editingExpiry, setEditingExpiry] = useState("");
  const [movementForm, setMovementForm] = useState({ date: "2026-05-13", type: "Entrada" as InventoryMovement["type"], code: "", units: "1", reference: "" });

  useEffect(() => {
    fetch("/api/v1/inventarios/reporte")
      .then((res) => res.json())
      .then((payload: ReporteData) => {
        setData(payload);
        const first = payload.products[0];
        if (first) {
          setSelectedCode(first.code);
          setMovementForm((current) => ({ ...current, code: first.code }));
        }
      })
      .catch(() => setData(emptyData));
  }, []);

  useEffect(() => {
    const firstVisible = products.find((item) => zone === "TODAS" || item.zone === zone);
    if (firstVisible && !products.some((item) => item.code === selectedCode && (zone === "TODAS" || item.zone === zone))) {
      setSelectedCode(firstVisible.code);
      setMovementForm((current) => ({ ...current, code: firstVisible.code }));
    }
  }, [zone, products, selectedCode]);

  const saveProducts = (next: InventoryProduct[]) => {
    setData((prev) => ({ ...prev, products: next }));
  };
  const saveMovements = (next: InventoryMovement[]) => {
    setData((prev) => ({ ...prev, movements: next }));
  };

  const zoneProducts = useMemo(() => products
    .filter((item) => zone === "TODAS" || item.zone === zone)
    .filter((item) => warehouse === "TODOS" || item.warehouse === warehouse), [products, zone, warehouse]);
  const warehouses = ["TODOS", ...new Set(products.filter((item) => zone === "TODAS" || item.zone === zone).map((item) => item.warehouse))];
  const totalUnits = zoneProducts.reduce((sum, item) => sum + item.units, 0);
  const totalValue = zoneProducts.reduce((sum, item) => sum + item.units * item.costBox, 0);
  const totalTransit = zoneProducts.reduce((sum, item) => sum + item.inTransit, 0);
  const critical = zoneProducts.filter((item) => inventoryStatus(item.units / item.monthlyDemand) === "Crítico");
  const selected = products.find((item) => item.code === selectedCode) ?? products[0];
  const idealStock = selected ? Math.ceil(selected.monthlyDemand * targetMonths) : 0;
  const replacementUnits = selected ? Math.max(0, idealStock - selected.units) : 0;
  const idealSale = selected ? Math.max(0, selected.units - idealStock) : 0;

  const dateRange = period === "semana"
    ? { from: "2026-05-07", to: "2026-05-13" }
    : period === "mes"
      ? { from: "2026-05-01", to: "2026-05-31" }
      : { from, to };
  const visibleMovements = movements.filter((item) =>
    (zone === "TODAS" || item.zone === zone) &&
    (warehouse === "TODOS" || item.warehouse === warehouse) &&
    item.date >= dateRange.from && item.date <= dateRange.to
  );
  const participation = zoneProducts.map((item) => ({
    name: item.code,
    value: item.units,
    participation: totalUnits ? item.units / totalUnits * 100 : 0,
  }));
  const rotationSource = period === "mes"
    ? data.rotationHistory
    : data.rotationWeekly.filter((item: RotationRow) => period === "semana" ? (item.date ?? "") >= dateRange.from && (item.date ?? "") <= dateRange.to : (item.date ?? "") >= from && (item.date ?? "") <= to);
  const rotation = rotationSource.map((item: RotationRow) => ({
    month: item.month,
    rotation: zone === "TODAS" ? item.consolidated : (item[zone as keyof RotationRow] as number) ?? 0,
  }));

  async function updateExpiry(product: InventoryProduct, expiry: string) {
    try {
      const res = await fetch("/api/v1/inventarios/reporte", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: product.code, expiry }),
      });
      if (!res.ok) throw new Error("Error al actualizar caducidad");
      saveProducts(products.map((item) => item.code === product.code && item.lot === product.lot ? { ...item, expiry } : item));
    } finally {
      setEditingExpiry("");
    }
  }

  async function addMovement(event: React.FormEvent) {
    event.preventDefault();
    const product = products.find((item) => item.code === movementForm.code);
    if (!product || !movementForm.reference.trim()) return;
    try {
      const res = await fetch("/api/v1/inventarios/reporte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: movementForm.date, type: movementForm.type, code: movementForm.code, units: Number(movementForm.units), reference: movementForm.reference }),
      });
      if (!res.ok) throw new Error("Error al guardar movimiento");
      const next: InventoryMovement = await res.json();
      saveMovements([next, ...movements]);
      setMovementForm((current) => ({ ...current, units: "1", reference: "" }));
    } catch {
      // ignore
    }
  }

  function exportInventory() {
    const rows = [
      ["CÓDIGO", "PRODUCTO", "ZONA", "ALMACÉN", "LOTE", "CADUCIDAD", "UNIDADES", "DEMANDA MENSUAL", "COBERTURA", "TRÁNSITO"],
      ...zoneProducts.map((item) => [item.code, item.product, item.zone, item.warehouse, item.lot, item.expiry, item.units, item.monthlyDemand, (item.units / item.monthlyDemand).toFixed(2), item.inTransit]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    link.download = `inventario-${zone}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="page" style={{ padding: "4px 4px 32px" }}>
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
        <div><h1 className="page-title">Centro de inventarios</h1><p className="page-subtitle">Existencias físicas, lotes, caducidades, movimientos y tránsito · {zone}</p></div>
        <button className="btn btn-ghost" onClick={exportInventory}><Download size={16} /> Exportar</button>
      </header>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
        {([
          ["general", "General", Boxes],
          ["desglose", "Almacén · producto · lote", Package],
          ["movimientos", "Movimientos", ArrowDownUp],
          ["transito", "En tránsito", Ship],
          ["calculadora", "Stock ideal", Calculator],
        ] as const).map(([key, label, Icon]) => (
          <button key={key} className={`btn ${tab === key ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab(key)}><Icon size={15} /> {label}</button>
        ))}
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard title="Unidades físicas" value={number(totalUnits)} subtitle={`${zoneProducts.length} productos/lotes`} trend={warehouse === "TODOS" ? "Todos los almacenes" : warehouse} trendUp icon={<Boxes size={19} color="#60a5fa" />} color="blue" />
        <StatCard title="Valor inventario" value={money(totalValue)} subtitle="Unidades × costo por caja" trend="Referencia financiera" trendUp icon={<Warehouse size={19} color="#8b5cf6" />} color="purple" />
        <StatCard title="Cobertura crítica" value={critical.length} subtitle="Menos de 1.5 meses" trend="Reabasto requerido" trendUp={false} icon={<CalendarClock size={19} color="#ef4444" />} color="red" />
        <StatCard title="Inventario en tránsito" value={number(totalTransit)} subtitle="Separado de existencia física" trend="Cajas confirmadas" trendUp icon={<Ship size={19} color="#f59e0b" />} color="orange" />
      </section>

      {(tab === "general" || tab === "desglose" || tab === "movimientos" || tab === "transito") && (
        <div className="card" style={{ padding: 12, marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
          <div className="form-group" style={{ margin: 0, minWidth: 220 }}><label className="form-label">Almacén</label><select className="form-input" value={warehouse} onChange={(event) => setWarehouse(event.target.value)}>{warehouses.map((item) => <option key={item}>{item === "TODOS" ? "Todos los almacenes" : item}</option>)}</select></div>
          {(tab === "general" || tab === "movimientos") && (
            <>
              {(["semana", "mes", "personalizado"] as const).map((item) => <button key={item} className={`btn ${period === item ? "btn-primary" : "btn-ghost"}`} onClick={() => setPeriod(item)} style={{ textTransform: "capitalize" }}>{item}</button>)}
              {period === "personalizado" && <><input className="form-input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /><input className="form-input" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></>}
            </>
          )}
        </div>
      )}

      {tab === "general" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(300px,1fr)", gap: 18 }}>
          <ChartCard title="Rotación histórica" subtitle="Unidades vendidas ÷ inventario físico promedio">
            <AreaChartComponent data={rotation} dataKeys={[{ key: "rotation", name: "Rotación", color: "#003087" }]} xAxisKey="month" height={310} />
          </ChartCard>
          <ChartCard title="Participación por producto" subtitle="Calculada por unidades, no por valor">
            <PieChartComponent data={participation} dataKey="value" nameKey="name" height={310} donut />
          </ChartCard>
        </div>
      )}

      {tab === "desglose" && (
        <div className="card">
          <h2 className="card-title">Desglose físico por almacén, producto, lote y caducidad</h2>
          <div className="table-wrap"><table>
            <thead><tr><th>Código / producto</th><th>Zona</th><th>Almacén</th><th>Lote</th><th>Caducidad</th><th>Unidades</th><th>Participación</th><th>Cobertura</th><th>Clasificación</th></tr></thead>
            <tbody>{zoneProducts.map((item) => {
              const coverage = item.units / item.monthlyDemand;
              const status = inventoryStatus(coverage);
              const editKey = `${item.code}-${item.lot}`;
              return <tr key={editKey}>
                <td><strong style={{ color: "#60a5fa" }}>{item.code}</strong><small style={{ display: "block" }}>{item.product}</small></td>
                <td><span className="badge badge-blue">{item.zone}</span></td><td>{item.warehouse}</td><td>{item.lot}</td>
                <td>{editingExpiry === editKey
                  ? <span style={{ display: "flex", gap: 5 }}><input className="form-input" type="date" defaultValue={item.expiry} id={`expiry-${editKey}`} /><button className="btn btn-primary" onClick={() => updateExpiry(item, (document.getElementById(`expiry-${editKey}`) as HTMLInputElement).value)}><Check size={14} /></button></span>
                  : <button className="btn btn-ghost" onClick={() => setEditingExpiry(editKey)}>{new Date(`${item.expiry}T12:00:00`).toLocaleDateString("es-MX")} <Pencil size={12} /></button>}
                </td>
                <td><strong>{number(item.units)}</strong></td><td>{totalUnits ? (item.units / totalUnits * 100).toFixed(1) : 0}%</td><td>{coverage.toFixed(2)} meses</td>
                <td><span className={`badge ${status === "Crítico" ? "badge-red" : status === "Óptimo" ? "badge-green" : "badge-blue"}`}>{status}</span></td>
              </tr>;
            })}</tbody>
          </table></div>
        </div>
      )}

      {tab === "movimientos" && (
        <>
          <form className="card" onSubmit={addMovement} style={{ marginBottom: 16 }}>
            <h2 className="card-title"><Plus size={16} /> Registrar movimiento</h2>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Fecha</label><input required className="form-input" type="date" value={movementForm.date} onChange={(event) => setMovementForm({ ...movementForm, date: event.target.value })} /></div>
              <div className="form-group"><label className="form-label">Tipo</label><select className="form-input" value={movementForm.type} onChange={(event) => setMovementForm({ ...movementForm, type: event.target.value as InventoryMovement["type"] })}>{["Entrada", "Salida", "Transferencia", "Ajuste"].map((item) => <option key={item}>{item}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Producto</label><select className="form-input" value={movementForm.code} onChange={(event) => setMovementForm({ ...movementForm, code: event.target.value })}>{products.filter((item) => zone === "TODAS" || item.zone === zone).map((item) => <option key={item.code} value={item.code}>{item.code} · {item.product}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Cajas / unidades</label><input required className="form-input" type="number" value={movementForm.units} onChange={(event) => setMovementForm({ ...movementForm, units: event.target.value })} /></div>
              <div className="form-group"><label className="form-label">Referencia / motivo</label><input required className="form-input" value={movementForm.reference} onChange={(event) => setMovementForm({ ...movementForm, reference: event.target.value.toUpperCase() })} /></div>
            </div>
            <button className="btn btn-primary" type="submit"><Save size={15} /> Guardar movimiento</button>
          </form>
          <div className="card"><h2 className="card-title">Historial de movimientos · {dateRange.from} a {dateRange.to}</h2><div className="table-wrap"><table>
            <thead><tr><th>Fecha</th><th>Movimiento</th><th>Zona / almacén</th><th>Código / producto</th><th>Lote</th><th>Cantidad</th><th>Referencia</th></tr></thead>
            <tbody>{visibleMovements.map((item) => <tr key={item.id}><td>{item.date}</td><td><span className="badge badge-blue">{item.type}</span></td><td>{item.zone}<small style={{ display: "block" }}>{item.warehouse}</small></td><td><strong>{item.code}</strong><small style={{ display: "block" }}>{item.product}</small></td><td>{item.lot}</td><td>{number(item.units)}</td><td>{item.reference}</td></tr>)}</tbody>
          </table></div></div>
        </>
      )}

      {tab === "transito" && (
        <div className="card"><h2 className="card-title">Inventario en tránsito independiente</h2><div className="table-wrap"><table>
          <thead><tr><th>Código / producto</th><th>Zona</th><th>Almacén destino</th><th>Lote</th><th>Cajas en tránsito</th><th>Valor estimado</th></tr></thead>
          <tbody>{zoneProducts.filter((item) => item.inTransit > 0).map((item) => <tr key={item.code}><td><strong style={{ color: "#60a5fa" }}>{item.code}</strong><small style={{ display: "block" }}>{item.product}</small></td><td>{item.zone}</td><td>{item.warehouse}</td><td>{item.lot}</td><td><strong>{number(item.inTransit)}</strong></td><td>{money(item.inTransit * item.costBox)}</td></tr>)}</tbody>
        </table></div></div>
      )}

      {tab === "calculadora" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(320px,1fr) minmax(0,2fr)", gap: 18 }}>
          <div className="card">
            <h2 className="card-title">Calculadora de stock ideal por producto</h2>
            <div className="form-group"><label className="form-label">Código / producto</label><select className="form-input" value={selectedCode} onChange={(event) => setSelectedCode(event.target.value)}>{products.filter((item) => zone === "TODAS" || item.zone === zone).map((item) => <option key={item.code} value={item.code}>{item.code} · {item.product}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Meta de cobertura (meses)</label><input className="form-input" type="number" min={0.1} step={0.1} value={targetMonths} onChange={(event) => setTargetMonths(Number(event.target.value))} /></div>
            <div className="kpi-card blue"><div className="kpi-label">Stock ideal</div><div className="kpi-value">{number(idealStock)}</div><div className="kpi-unit">demanda mensual × cobertura objetivo</div></div>
            <p><strong>Costo de reposición por caja:</strong> {money(selected.costBox)}</p>
            <p><strong>Reposición necesaria:</strong> {number(replacementUnits)} cajas · {money(replacementUnits * selected.costBox)}</p>
            <p><strong>Venta ideal para alcanzar meta:</strong> {number(idealSale)} cajas</p>
          </div>
          <ChartCard title="Stock actual vs meta" subtitle={`${selected.code} · ${selected.product}`}>
            <BarChartComponent data={[{ metric: "Actual", units: selected.units }, { metric: "Ideal", units: idealStock }, { metric: "Tránsito", units: selected.inTransit }]} dataKeys={[{ key: "units", name: "Cajas", color: "#003087" }]} xAxisKey="metric" height={330} />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
