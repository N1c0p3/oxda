"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChartComponent,
  ChartCard,
  LineChartComponent,
} from "@/components/charts";
import {
  AlertTriangle,
  Anchor,
  CircleDollarSign,
  Package,
  Ship,
  TrendingUp,
} from "lucide-react";
import { useZone } from "@/components/zone-filter";

/* ---------- Tipos ---------- */
type ContainerRecord = {
  puerto: string;
  pedido: string;
  facturaFecha: string | null;
  totalFact: number | null;
  etd: string;
  eta: string;
  pedidoNum: string;
  contenedor: string;
  cliente: string;
  estatus: string;
  factura: string;
  entrega: string;
  vencimiento: string;
  pago: string;
  leadOrderToEtdDays: number;
  leadTransitDays: number;
  leadEtaToWarehouseDays: number;
  leadTotalDays: number;
};

type LeadMetric = { avg: number; median: number; count?: number };

type LogisticsData = {
  containers: ContainerRecord[];
  metrics: {
    totalContenedores: number;
    leadTimesGlobal: Record<string, LeadMetric>;
    leadTimesByPort: Record<string, LeadMetric>;
    leadTimesByClient: Record<string, LeadMetric>;
  };
  supplierControls: unknown[];
};

type SalesData = {
  monthly: Array<{
    Año: number;
    Mes: string;
    "Código Producto": string;
    "Nombre (Producto)": string;
    "Código Almacén": string;
    "Nombre (Almacén)": string;
    DIVISION: string;
    RUBRO: string;
    unidades: number;
    venta: number;
    costo: number;
    margen: number;
  }>;
  productWarehouse: Array<{
    codigoProducto: string;
    nombreProducto: string;
    codigoAlmacen: string;
    nombreAlmacen: string;
    division: string;
    rubro: string;
    unidades: number;
    venta: number;
    margenPct: number;
    promedioDiarioUnidades: number;
    promedioDiarioVenta: number;
  }>;
  productSeries: Record<string, Record<string, { unidades: number; venta: number }>>;
  productNames: Record<string, string>;
  dateRange: { min: string; max: string };
};

type Prediction = {
  codigoProducto: string;
  nombreProducto: string;
  almacen: string;
  division: string;
  rubro: string;
  promedioDiarioUnidades: number;
  promedioDiarioVenta: number;
  coberturaSugeridaDias: number;
  demandaLeadTime: number;
  demanda30Dias: number;
  demanda60Dias: number;
  puntoReorden: number;
  stockSugerido: number;
  fechaSugeridaPedido: string;
  fechaLlegadaEstimada: string;
  fechaCaducidadBatch: string;
  shelfLifeDays: number;
};

type PredictionsData = {
  leadTimeAvgDays: number;
  shelfLifeDays: number;
  demandPredictions: Prediction[];
  monthlyProjection: Array<{
    codigoProducto: string;
    nombreProducto: string;
    mes: string;
    unidadesProyectadas: number;
    ventaProyectada: number;
  }>;
};

type Commission = {
  id: string;
  seller: string;
  zone: string;
  sale: number;
  rate: number;
  status: "Por autorizar" | "Programada" | "Pagada";
  paymentDate: string;
};

const COMMISSION_SEED: Commission[] = [
  { id: "COM-001", seller: "MARIO", zone: "GDL", sale: 916518, rate: 1.5, status: "Por autorizar", paymentDate: "" },
  { id: "COM-002", seller: "GABRIELA", zone: "MEN VLP", sale: 159504, rate: 2, status: "Programada", paymentDate: "2026-07-31" },
  { id: "COM-003", seller: "DIEGO", zone: "CS", sale: 144616, rate: 2, status: "Pagada", paymentDate: "2026-07-15" },
  { id: "COM-004", seller: "GAMALIEL", zone: "QR", sale: 44661, rate: 2.5, status: "Por autorizar", paymentDate: "" },
  { id: "COM-005", seller: "MKT", zone: "MAY VLP", sale: 40408, rate: 1, status: "Programada", paymentDate: "2026-07-31" },
];

const MESES_ORD = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/* ---------- Helpers ---------- */
function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { dateStyle: "medium" });
}

function fmtMoney(n?: number) {
  if (n === undefined || n === null || Number.isNaN(n)) return "$—";
  return "$" + n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

function fmtNumber(n?: number) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

/* ---------- Componente ---------- */
export default function LogisticaPrediccionPage() {
  const { zone } = useZone();
  const [logistics, setLogistics] = useState<LogisticsData | null>(null);
  const [sales, setSales] = useState<SalesData | null>(null);
  const [predictions, setPredictions] = useState<PredictionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"resumen" | "rotacion" | "predicciones" | "contenedores" | "comisiones">("resumen");
  const [rotationWarehouse, setRotationWarehouse] = useState("TODOS");
  const [rotationPeriod, setRotationPeriod] = useState("Todos");
  const [commissions, setCommissions] = useState(COMMISSION_SEED);

  useEffect(() => {
    async function load() {
      try {
        const [r1, r2, r3] = await Promise.all([
          fetch("/data/logistica.json"),
          fetch("/data/ventas_mensual.json"),
          fetch("/data/predicciones.json"),
        ]);
        if (!r1.ok || !r2.ok || !r3.ok) throw new Error("No se pudieron cargar los datos");
        setLogistics(await r1.json());
        setSales(await r2.json());
        setPredictions(await r3.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("oxda-accounts-payable-commissions");
    if (saved) setCommissions(JSON.parse(saved));
  }, []);

  const saveCommissions = (next: Commission[]) => {
    setCommissions(next);
    localStorage.setItem("oxda-accounts-payable-commissions", JSON.stringify(next));
  };

  /* KPIs y datos derivados */
  const totalSales2026 = useMemo(
    () => sales?.monthly.reduce((acc, m) => acc + m.venta, 0) ?? 0,
    [sales]
  );

  const leadGlobal = logistics?.metrics.leadTimesGlobal;

  const topProduct = useMemo(() => {
    if (!sales?.productWarehouse.length) return null;
    return sales.productWarehouse.reduce((a, b) => (a.unidades > b.unidades ? a : b));
  }, [sales]);

  const rotationRows = useMemo(() => {
    if (!sales) return [];
    if (rotationPeriod === "Todos") {
      return sales.productWarehouse
        .filter((item) => zone === "TODAS" || item.rubro.toUpperCase() === zone)
        .filter((item) => rotationWarehouse === "TODOS" || item.nombreAlmacen === rotationWarehouse)
        .sort((a, b) => b.promedioDiarioUnidades - a.promedioDiarioUnidades);
    }
    const grouped = new Map<string, SalesData["productWarehouse"][number]>();
    sales.monthly
      .filter((item) => item.Mes === rotationPeriod)
      .filter((item) => zone === "TODAS" || item.RUBRO.toUpperCase() === zone)
      .filter((item) => rotationWarehouse === "TODOS" || item["Nombre (Almacén)"] === rotationWarehouse)
      .forEach((item) => {
        const key = `${item["Código Producto"]}-${item["Código Almacén"]}`;
        const previous = grouped.get(key);
        const units = (previous?.unidades ?? 0) + item.unidades;
        const sale = (previous?.venta ?? 0) + item.venta;
        const margin = (previous ? previous.venta * previous.margenPct / 100 : 0) + item.margen;
        grouped.set(key, {
          codigoProducto: item["Código Producto"],
          nombreProducto: item["Nombre (Producto)"],
          codigoAlmacen: item["Código Almacén"],
          nombreAlmacen: item["Nombre (Almacén)"],
          division: item.DIVISION,
          rubro: item.RUBRO,
          unidades: units,
          venta: sale,
          margenPct: sale ? margin / sale * 100 : 0,
          promedioDiarioUnidades: units / 30,
          promedioDiarioVenta: sale / 30,
        });
      });
    return [...grouped.values()].sort((a, b) => b.promedioDiarioUnidades - a.promedioDiarioUnidades);
  }, [sales, zone, rotationWarehouse, rotationPeriod]);

  const warehouseOptions = useMemo(() =>
    ["TODOS", ...new Set(sales?.productWarehouse.map((item) => item.nombreAlmacen) ?? [])], [sales]);

  const commissionRows = commissions.filter((item) => zone === "TODAS" || item.zone === zone);

  const leadStageChart = useMemo(() => {
    if (!leadGlobal) return [];
    return [
      { etapa: "Pedido → ETD", dias: leadGlobal.orderToEtd?.avg ?? 0 },
      { etapa: "Tránsito (ETD→ETA)", dias: leadGlobal.transit?.avg ?? 0 },
      { etapa: "Aduana → Almacén", dias: leadGlobal.etaToWarehouse?.avg ?? 0 },
      { etapa: "Total pedido → almacén", dias: leadGlobal.totalOrderToWarehouse?.avg ?? 0 },
    ];
  }, [leadGlobal]);

  const leadPortChart = useMemo(() => {
    if (!logistics) return [];
    return Object.entries(logistics.metrics.leadTimesByPort)
      .filter(([, v]) => v.count && v.count > 2)
      .map(([puerto, v]) => ({ puerto, dias: v.avg }))
      .sort((a, b) => b.dias - a.dias);
  }, [logistics]);

  const monthlySalesChart = useMemo(() => {
    if (!sales) return [];
    const agg: Record<string, { mes: string; unidades: number; venta: number }> = {};
    for (const m of sales.monthly) {
      if (!agg[m.Mes]) agg[m.Mes] = { mes: m.Mes, unidades: 0, venta: 0 };
      agg[m.Mes].unidades += m.unidades;
      agg[m.Mes].venta += m.venta;
    }
    const projected: Record<string, { mes: string; unidades: number; venta: number }> = {};
    if (predictions) {
      for (const p of predictions.monthlyProjection) {
        if (!projected[p.mes]) projected[p.mes] = { mes: p.mes, unidades: 0, venta: 0 };
        projected[p.mes].unidades += p.unidadesProyectadas;
        projected[p.mes].venta += p.ventaProyectada;
      }
    }
    return MESES_ORD.map((m) => ({
      mes: m.slice(0, 3),
      histórico: agg[m]?.unidades ?? 0,
      proyectado: projected[m]?.unidades ?? 0,
    }));
  }, [sales, predictions]);

  const portDistribution = useMemo(() => {
    if (!logistics) return [];
    const counts: Record<string, number> = {};
    for (const c of logistics.containers) {
      if (c.puerto) counts[c.puerto] = (counts[c.puerto] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([puerto, total]) => ({ puerto, total }))
      .sort((a, b) => b.total - a.total);
  }, [logistics]);

  if (loading) {
    return (
      <>
        <div className="topbar">
          <span className="topbar-title">🚢 Logística & Predicción</span>
        </div>
        <div className="page">
          <div className="empty">
            <div className="empty-icon">⏳</div>
            <p>Cargando datos de ventas y logística…</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !logistics || !sales || !predictions) {
    return (
      <>
        <div className="topbar">
          <span className="topbar-title">🚢 Logística & Predicción</span>
        </div>
        <div className="page">
          <div className="alert alert-error">
            {error ?? "Error al cargar los datos"}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">🚢 Logística & Predicción</span>
        <span className="topbar-badge">Ventas · Lead time · Caducidad</span>
      </div>

      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Predicción de ventas y logística</h1>
          <p className="page-subtitle">
            Proyección a partir del reporte de ventas 2026 y tiempos históricos de importación (2022).
            Considera caducidad de 2 meses desde llegada a almacén.
          </p>
        </div>

        {/* KPIs */}
        <div className="kpi-grid" style={{ marginBottom: "1.25rem" }}>
          <div className="kpi-card blue">
            <div className="kpi-label">Contenedores analizados</div>
            <div className="kpi-value">{fmtNumber(logistics.metrics.totalContenedores)}</div>
            <div className="kpi-unit">Histórico importación</div>
          </div>
          <div className="kpi-card orange">
            <div className="kpi-label">Lead time promedio</div>
            <div className="kpi-value">{fmtNumber(leadGlobal?.totalOrderToWarehouse?.avg)} días</div>
            <div className="kpi-unit">Pedido internacional → almacén MX</div>
          </div>
          <div className="kpi-card green">
            <div className="kpi-label">Venta acumulada 2026</div>
            <div className="kpi-value">{fmtMoney(totalSales2026)}</div>
            <div className="kpi-unit">{fmtDate(sales.dateRange.min)} – {fmtDate(sales.dateRange.max)}</div>
          </div>
          <div className="kpi-card red">
            <div className="kpi-label">Vida útil objetivo</div>
            <div className="kpi-value">60 días</div>
            <div className="kpi-unit">2 meses desde llegada a almacén</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <TabButton active={tab === "resumen"} onClick={() => setTab("resumen")} icon={<TrendingUp size={16} />} label="Resumen" />
          <TabButton active={tab === "rotacion"} onClick={() => setTab("rotacion")} icon={<Anchor size={16} />} label="Rotación de productos" />
          <TabButton active={tab === "predicciones"} onClick={() => setTab("predicciones")} icon={<Package size={16} />} label="Sugerencias de compra" />
          <TabButton active={tab === "contenedores"} onClick={() => setTab("contenedores")} icon={<Ship size={16} />} label="Histórico de contenedores" />
          <TabButton active={tab === "comisiones"} onClick={() => setTab("comisiones")} icon={<CircleDollarSign size={16} />} label="Cuentas por pagar" />
        </div>

        {tab === "resumen" && (
          <>
            <div className="two-col" style={{ marginBottom: "1rem" }}>
              <ChartCard title="Tiempos de logística por etapa" subtitle="Días promedio">
                <BarChartComponent
                  data={leadStageChart}
                  xAxisKey="etapa"
                  dataKeys={[{ key: "dias", name: "Días promedio", color: "#00a0e3" }]}
                  height={260}
                />
              </ChartCard>
              <ChartCard title="Lead time total por puerto" subtitle="Días promedio (puertos con >2 contenedores)">
                <BarChartComponent
                  data={leadPortChart}
                  xAxisKey="puerto"
                  dataKeys={[{ key: "dias", name: "Días promedio", color: "#003087" }]}
                  height={260}
                />
              </ChartCard>
            </div>

            <div className="two-col" style={{ marginBottom: "1rem" }}>
              <ChartCard title="Unidades mensuales: histórico vs proyección" subtitle="2026">
                <LineChartComponent
                  data={monthlySalesChart}
                  xAxisKey="mes"
                  dataKeys={[
                    { key: "histórico", name: "Histórico", color: "#003087" },
                    { key: "proyectado", name: "Proyectado", color: "#f59e0b" },
                  ]}
                  height={280}
                />
              </ChartCard>
              <ChartCard title="Contenedores por puerto de arribo" subtitle="Distribución histórica">
                <BarChartComponent
                  data={portDistribution}
                  xAxisKey="puerto"
                  dataKeys={[{ key: "total", name: "Contenedores", color: "#60a5fa" }]}
                  height={280}
                />
              </ChartCard>
            </div>

            {topProduct && (
              <div className="card" style={{ marginBottom: "1rem" }}>
                <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Anchor size={18} />
                  Producto con mayor rotación
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Producto</div>
                    <div style={{ fontWeight: 700 }}>{topProduct.nombreProducto}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{topProduct.codigoProducto}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Almacén</div>
                    <div>{topProduct.nombreAlmacen}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Unidades vendidas</div>
                    <div style={{ fontWeight: 800, fontSize: "1.3rem" }}>{fmtNumber(topProduct.unidades)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Promedio diario</div>
                    <div style={{ fontWeight: 700 }}>{fmtNumber(topProduct.promedioDiarioUnidades)} cajas/día</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Margen</div>
                    <div style={{ fontWeight: 700 }}>{topProduct.margenPct}%</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "predicciones" && (
          <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Package size={18} />
              Sugerencias de compra internacional
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "1rem" }}>
              Cálculo basado en venta diaria promedio, lead time estimado de {predictions.leadTimeAvgDays} días y vida útil de {predictions.shelfLifeDays} días.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Almacén</th>
                    <th>Promedio diario</th>
                    <th>Demanda 30 días</th>
                    <th>Stock sugerido</th>
                    <th>Fecha pedido</th>
                    <th>Llegada estimada</th>
                    <th>Caducidad batch</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.demandPredictions.map((p) => (
                    <tr key={`${p.codigoProducto}-${p.almacen}`}>
                      <td>
                        <strong>{p.nombreProducto}</strong>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p.codigoProducto}</div>
                      </td>
                      <td>{p.almacen}</td>
                      <td>{fmtNumber(p.promedioDiarioUnidades)} cjs</td>
                      <td>{fmtNumber(p.demanda30Dias)}</td>
                      <td style={{ fontWeight: 700 }}>{fmtNumber(p.stockSugerido)}</td>
                      <td>{fmtDate(p.fechaSugeridaPedido)}</td>
                      <td>{fmtDate(p.fechaLlegadaEstimada)}</td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <AlertTriangle size={14} color="var(--warning)" />
                          {fmtDate(p.fechaCaducidadBatch)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "rotacion" && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end", flexWrap: "wrap", marginBottom: 14 }}>
              <div>
                <h2 className="card-title" style={{ margin: 0 }}>Rotación de todos los productos</h2>
                <p className="page-subtitle">Promedio diario de unidades facturadas · zona {zone}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select className="form-input" value={rotationWarehouse} onChange={(event) => setRotationWarehouse(event.target.value)}>
                  {warehouseOptions.map((warehouse) => <option key={warehouse} value={warehouse}>{warehouse === "TODOS" ? "Todos los almacenes" : warehouse}</option>)}
                </select>
                <select className="form-input" value={rotationPeriod} onChange={(event) => setRotationPeriod(event.target.value)}>
                  {["Todos", ...MESES_ORD.slice(0, 5)].map((period) => <option key={period}>{period}</option>)}
                </select>
              </div>
            </div>
            <BarChartComponent data={rotationRows.slice(0, 12)} xAxisKey="codigoProducto" dataKeys={[{ key: "promedioDiarioUnidades", name: "Unidades/día", color: "#00a0e3" }]} height={300} />
            <div className="table-wrap" style={{ marginTop: 16 }}>
              <table>
                <thead><tr><th>#</th><th>Código / producto</th><th>Almacén</th><th>Zona</th><th>Unidades</th><th>Promedio diario</th><th>Venta</th><th>Margen</th></tr></thead>
                <tbody>
                  {rotationRows.map((item, index) => (
                    <tr key={`${item.codigoProducto}-${item.codigoAlmacen}`}>
                      <td><strong>{index + 1}</strong></td>
                      <td><strong style={{ color: "#60a5fa" }}>{item.codigoProducto}</strong><small style={{ display: "block" }}>{item.nombreProducto}</small></td>
                      <td>{item.nombreAlmacen}</td>
                      <td><span className="badge badge-blue">{item.rubro}</span></td>
                      <td>{fmtNumber(item.unidades)}</td>
                      <td><strong>{item.promedioDiarioUnidades.toFixed(2)}</strong></td>
                      <td>{fmtMoney(item.venta)}</td>
                      <td>{item.margenPct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "contenedores" && (
          <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Ship size={18} />
              Histórico de contenedores
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Contenedor</th>
                    <th>Puerto</th>
                    <th>Cliente</th>
                    <th>Pedido</th>
                    <th>ETD</th>
                    <th>ETA</th>
                    <th>Entrega</th>
                    <th>Tránsito</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {logistics.containers.slice(0, 50).map((c) => (
                    <tr key={c.contenedor}>
                      <td><strong>{c.contenedor}</strong></td>
                      <td>{c.puerto ?? "—"}</td>
                      <td>{c.cliente ?? "—"}</td>
                      <td>{fmtDate(c.pedido)}</td>
                      <td>{fmtDate(c.etd)}</td>
                      <td>{fmtDate(c.eta)}</td>
                      <td>{fmtDate(c.entrega)}</td>
                      <td>{fmtNumber(c.leadTransitDays)} d</td>
                      <td>{c.totalFact ? fmtMoney(c.totalFact) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "comisiones" && (
          <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CircleDollarSign size={18} />
              Pago de comisiones · Cuentas por pagar
            </div>
            <p className="page-subtitle">Importes calculados sobre venta facturada, con autorización, programación y pago persistentes.</p>
            <div className="kpi-grid">
              <div className="kpi-card blue"><div className="kpi-label">Comisiones por pagar</div><div className="kpi-value">{fmtMoney(commissionRows.filter((item) => item.status !== "Pagada").reduce((sum, item) => sum + item.sale * item.rate / 100, 0))}</div></div>
              <div className="kpi-card green"><div className="kpi-label">Comisiones pagadas</div><div className="kpi-value">{fmtMoney(commissionRows.filter((item) => item.status === "Pagada").reduce((sum, item) => sum + item.sale * item.rate / 100, 0))}</div></div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Vendedor</th><th>Zona</th><th>Venta base</th><th>Tasa</th><th>Comisión</th><th>Fecha de pago</th><th>Estado</th></tr></thead>
                <tbody>
                  {commissionRows.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.seller}</strong></td>
                      <td><span className="badge badge-blue">{item.zone}</span></td>
                      <td>{fmtMoney(item.sale)}</td>
                      <td>{item.rate}%</td>
                      <td><strong>{fmtMoney(item.sale * item.rate / 100)}</strong></td>
                      <td><input className="form-input" type="date" value={item.paymentDate} onChange={(event) => saveCommissions(commissions.map((row) => row.id === item.id ? { ...row, paymentDate: event.target.value } : row))} /></td>
                      <td>
                        <select className="form-input" value={item.status} onChange={(event) => saveCommissions(commissions.map((row) => row.id === item.id ? { ...row, status: event.target.value as Commission["status"] } : row))}>
                          <option>Por autorizar</option><option>Programada</option><option>Pagada</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 22px",
        borderRadius: "10px",
        border: "1px solid",
        borderColor: active ? "rgba(0,48,135,0.55)" : "rgba(255,255,255,0.10)",
        background: active ? "rgba(0,48,135,0.28)" : "rgba(255,255,255,0.04)",
        color: active ? "#fff" : "var(--text-muted)",
        fontSize: "13px",
        fontWeight: 700,
        cursor: "pointer",
        transition: "all .18s ease",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
