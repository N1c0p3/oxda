"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarRange,
  ChevronRight,
  Download,
  FileCheck2,
  Package,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { AreaChartComponent, BarChartComponent, ChartCard, StatCard } from "@/components/charts";
import { OXDA_ZONES, useZone } from "@/components/zone-filter";

type ProductDetail = {
  code: string;
  product: string;
  category?: string;
  zone?: string;
  units: number;
  sale: number;
  cost: number;
  margin: number;
  marginPct: number;
  frequency: number;
  rotation: number;
};

type Customer = {
  code: string;
  customer: string;
  zone: string;
  seller: string;
  units: number;
  sale: number;
  cost: number;
  margin: number;
  marginPct: number;
  frequency: number;
  rotation: number;
  products: ProductDetail[];
};

type Analytics = {
  filters: {
    zone: string;
    month: string;
    from: string;
    to: string;
    firstDate: string;
    lastDate: string;
    periodDays: number;
    trendDimension?: string;
    trendKey?: string;
  };
  kpis: {
    sale: number;
    budget: number;
    budgetComparableSale: number;
    achievementPct: number | null;
    units: number;
    cost: number;
    margin: number;
    marginPct: number;
    mcp: null;
    customers: number;
    orders: number;
    averageTicket: number;
  };
  customers: Customer[];
  products: ProductDetail[];
  trend: Array<{ month: string; sale: number; units: number; factor: number | null }>;
  formulas: Array<{ metric: string; formula: string; source: string; status: string }>;
};

type View = "resumen" | "clientes" | "productos" | "formulas";
type Period = "semana" | "mes" | "personalizado" | "acumulado";

const MONTHS = [
  { value: "Ene", label: "Enero" },
  { value: "Feb", label: "Febrero" },
  { value: "Mar", label: "Marzo" },
  { value: "Abr", label: "Abril" },
  { value: "May", label: "Mayo" },
];

const money = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const number = (value: number) => value.toLocaleString("es-MX", { maximumFractionDigits: 1 });

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const content = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function SalesReportPage() {
  const { zone } = useZone();
  const [view, setView] = useState<View>("resumen");
  const [period, setPeriod] = useState<Period>("acumulado");
  const [month, setMonth] = useState("May");
  const [from, setFrom] = useState("2026-05-01");
  const [to, setTo] = useState("2026-05-13");
  const [query, setQuery] = useState("");
  const [trendDimension, setTrendDimension] = useState<"total" | "product" | "customer" | "zone">("total");
  const [trendKey, setTrendKey] = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ zone });
    params.set("trendDimension", trendDimension);
    if (trendKey) params.set("trendKey", trendKey);
    if (period === "mes") params.set("month", month);
    if (period === "acumulado") params.set("month", "Acumulado");
    if (period === "semana") {
      params.set("from", "2026-05-07");
      params.set("to", "2026-05-13");
    }
    if (period === "personalizado") {
      params.set("from", from);
      params.set("to", to);
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/v1/ventas/analitica?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "No fue posible cargar el reporte.");
        setAnalytics(payload);
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") setError(fetchError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [zone, period, month, from, to, trendDimension, trendKey]);

  const customers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (analytics?.customers ?? []).filter((customer) =>
      !normalized ||
      customer.customer.toLowerCase().includes(normalized) ||
      customer.code.toLowerCase().includes(normalized) ||
      customer.seller.toLowerCase().includes(normalized)
    );
  }, [analytics, query]);

  const products = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (analytics?.products ?? []).filter((product) =>
      !normalized ||
      product.product.toLowerCase().includes(normalized) ||
      product.code.toLowerCase().includes(normalized) ||
      product.category?.toLowerCase().includes(normalized)
    );
  }, [analytics, query]);

  const periodLabel = period === "semana"
    ? "Últimos 7 días facturados"
    : period === "mes"
      ? MONTHS.find((item) => item.value === month)?.label
      : period === "personalizado"
        ? `${from} a ${to}`
        : "Enero a mayo 2026";

  const trendOptions = trendDimension === "product"
    ? (analytics?.products ?? []).map((item) => ({ value: item.code, label: `${item.code} · ${item.product}` }))
    : trendDimension === "customer"
      ? (analytics?.customers ?? []).map((item) => ({ value: item.code, label: `${item.code} · ${item.customer}` }))
      : trendDimension === "zone"
        ? OXDA_ZONES.filter((item) => item !== "TODAS").map((item) => ({ value: item, label: item }))
        : [];

  const exportCurrent = () => {
    if (!analytics) return;
    if (view === "clientes") {
      downloadCsv(`clientes-${zone}.csv`, [
        ["Código", "Cliente", "Zona", "Unidades", "Venta", "Costo", "Margen", "Frecuencia", "Rotación mensual"],
        ...customers.map((item) => [item.code, item.customer, item.zone, item.units, item.sale, item.cost, item.margin, item.frequency, item.rotation]),
      ]);
      return;
    }
    downloadCsv(`productos-${zone}.csv`, [
      ["Código", "Producto", "Categoría", "Unidades", "Venta", "Costo", "Margen", "Frecuencia", "Rotación mensual"],
      ...products.map((item) => [item.code, item.product, item.category ?? "", item.units, item.sale, item.cost, item.margin, item.frequency, item.rotation]),
    ]);
  };

  return (
    <div className="page" style={{ padding: "4px 4px 30px" }}>
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Salón de Ventas</h1>
          <p className="page-subtitle">
            Facturación real · {periodLabel} · {zone === "TODAS" ? "todas las zonas" : `zona ${zone}`}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={exportCurrent}>
          <Download size={16} /> Exportar
        </button>
      </header>

      <div className="card" style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "end" }}>
          <div className="form-group" style={{ minWidth: 260 }}>
            <label className="form-label"><CalendarRange size={12} /> Periodo</label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {(["semana", "mes", "personalizado", "acumulado"] as Period[]).map((item) => (
                <button
                  key={item}
                  className={`btn ${period === item ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setPeriod(item)}
                  style={{ padding: "7px 11px", textTransform: "capitalize" }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          {period === "mes" && (
            <div className="form-group" style={{ minWidth: 150 }}>
              <label className="form-label">Mes</label>
              <select className="form-input" value={month} onChange={(event) => setMonth(event.target.value)}>
                {MONTHS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
          )}
          {period === "personalizado" && (
            <>
              <div className="form-group">
                <label className="form-label">Desde</label>
                <input className="form-input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Hasta</label>
                <input className="form-input" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
              </div>
            </>
          )}
        </div>
      </div>

      <nav style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
        {([
          ["resumen", "Resumen", BarChart3],
          ["clientes", "Clientes", Users],
          ["productos", "Productos", Package],
          ["formulas", "Fórmulas", FileCheck2],
        ] as const).map(([key, label, Icon]) => (
          <button key={key} className={`btn ${view === key ? "btn-primary" : "btn-ghost"}`} onClick={() => setView(key)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </nav>

      {loading && <div className="card empty">Calculando ventas desde la facturación…</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && analytics && (
        <>
          {view === "resumen" && (
            <>
              <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 20 }}>
                <StatCard title="Venta neta" value={money(analytics.kpis.sale)} subtitle={periodLabel || ""} trend={`${number(analytics.kpis.units)} unidades`} trendUp icon={<TrendingUp size={19} color="#60a5fa" />} color="blue" />
                <StatCard title="Presupuesto / meta" value={analytics.kpis.budget ? money(analytics.kpis.budget) : "Sin meta"} subtitle={analytics.kpis.achievementPct === null ? "No configurado para la zona" : `${analytics.kpis.achievementPct.toFixed(1)}% · venta comparable ${money(analytics.kpis.budgetComparableSale)}`} trend={analytics.kpis.achievementPct !== null && analytics.kpis.achievementPct >= 100 ? "Meta alcanzada" : "Meta en curso"} trendUp={(analytics.kpis.achievementPct ?? 0) >= 100} icon={<BarChart3 size={19} color="#f59e0b" />} color="orange" />
                <StatCard title="Costo" value={money(analytics.kpis.cost)} subtitle="Costo total facturado" trend="Base para margen" trendUp icon={<Package size={19} color="#8b5cf6" />} color="purple" />
                <StatCard title="Margen" value={money(analytics.kpis.margin)} subtitle={`${analytics.kpis.marginPct.toFixed(1)}% ponderado`} trend="Venta − costo" trendUp={analytics.kpis.margin >= 0} icon={<TrendingUp size={19} color="#22c55e" />} color="green" />
                <StatCard title="MCP" value="Pendiente" subtitle="Definición funcional requerida" trend="No se sustituye por margen" trendUp={false} icon={<AlertCircle size={19} color="#f59e0b" />} color="orange" />
                <StatCard title="Pedidos / documentos" value={number(analytics.kpis.orders)} subtitle={`${analytics.kpis.customers} clientes`} trend={`Ticket ${money(analytics.kpis.averageTicket)}`} trendUp icon={<Users size={19} color="#60a5fa" />} color="blue" />
              </section>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(300px,1fr)", gap: 18, marginBottom: 18 }}>
                <ChartCard title="Tendencia desde facturación" subtitle="Venta neta mensual y factor contra el mes anterior">
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    <select className="form-input" value={trendDimension} onChange={(event) => { setTrendDimension(event.target.value as typeof trendDimension); setTrendKey(""); }}>
                      <option value="total">Tendencia total</option>
                      <option value="product">Por producto</option>
                      <option value="customer">Por cliente</option>
                      <option value="zone">Por zona</option>
                    </select>
                    {trendDimension !== "total" && (
                      <select className="form-input" value={trendKey} onChange={(event) => setTrendKey(event.target.value)}>
                        <option value="">Selecciona {trendDimension === "product" ? "producto" : trendDimension === "customer" ? "cliente" : "zona"}…</option>
                        {trendOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    )}
                  </div>
                  <AreaChartComponent data={analytics.trend} dataKeys={[{ key: "sale", name: "Venta", color: "#003087" }]} xAxisKey="month" height={290} />
                </ChartCard>
                <ChartCard title="Factor de tendencia" subtitle="1.00 = mismo nivel que el mes anterior">
                  <div style={{ display: "grid", gap: 9 }}>
                    {analytics.trend.map((item) => (
                      <div key={item.month} style={{ display: "grid", gridTemplateColumns: "44px 1fr 70px", gap: 8, alignItems: "center" }}>
                        <strong>{item.month}</strong>
                        <div style={{ height: 7, background: "rgba(148,163,184,.18)", borderRadius: 9 }}>
                          <div style={{ height: "100%", width: `${Math.min(100, (item.factor ?? 0) * 65)}%`, borderRadius: 9, background: (item.factor ?? 0) >= 1 ? "#22c55e" : "#f59e0b" }} />
                        </div>
                        <span style={{ textAlign: "right", color: (item.factor ?? 0) >= 1 ? "#22c55e" : "var(--text-muted)", fontWeight: 700 }}>
                          {item.factor ? `${item.factor.toFixed(2)}x` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: 18 }}>
                <ChartCard title={`Top clientes · ${zone}`} subtitle="Clic para consultar productos comprados">
                  <BarChartComponent data={analytics.customers.slice(0, 8)} dataKeys={[{ key: "sale", name: "Venta", color: "#003087" }]} xAxisKey="customer" height={310} />
                </ChartCard>
                <ChartCard title={`Productos con mayor movimiento · ${zone}`} subtitle="Ranking por unidades facturadas">
                  <BarChartComponent data={analytics.products.slice(0, 8)} dataKeys={[{ key: "units", name: "Unidades", color: "#00a0e3" }]} xAxisKey="code" height={310} />
                </ChartCard>
              </div>
            </>
          )}

          {(view === "clientes" || view === "productos") && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
                <div>
                  <h2 className="card-title" style={{ margin: 0 }}>
                    {view === "clientes" ? `Ranking de clientes por zona · ${zone}` : `Ranking de productos por zona · ${zone}`}
                  </h2>
                  <p className="page-subtitle">
                    {view === "clientes" ? "Selecciona un cliente para ver cantidades, importe, frecuencia y rotación por producto." : "Ordenado por movimiento físico (unidades), con venta, costo y margen."}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 280 }} className="form-input">
                  <Search size={15} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar código, nombre o vendedor…"
                    style={{ border: 0, outline: 0, background: "transparent", color: "inherit", width: "100%" }}
                  />
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    {view === "clientes" ? (
                      <tr><th>Cliente</th><th>Zona</th><th>Vendedor</th><th>Frecuencia</th><th>Unidades</th><th>Venta</th><th>Margen</th><th /></tr>
                    ) : (
                      <tr><th>Código / Producto</th><th>Categoría</th><th>Frecuencia</th><th>Rotación mensual</th><th>Unidades</th><th>Venta</th><th>Costo</th><th>Margen</th></tr>
                    )}
                  </thead>
                  <tbody>
                    {view === "clientes" ? customers.map((item) => (
                      <tr key={item.code} onClick={() => setSelectedCustomer(item)} style={{ cursor: "pointer" }}>
                        <td><strong>{item.customer}</strong><small style={{ display: "block", color: "var(--text-muted)" }}>{item.code}</small></td>
                        <td><span className="badge badge-blue">{item.zone}</span></td>
                        <td>{item.seller}</td>
                        <td>{item.frequency} docs.</td>
                        <td>{number(item.units)}</td>
                        <td><strong>{money(item.sale)}</strong></td>
                        <td style={{ color: item.marginPct >= 15 ? "#22c55e" : "#f59e0b" }}>{money(item.margin)} · {item.marginPct.toFixed(1)}%</td>
                        <td><ChevronRight size={16} /></td>
                      </tr>
                    )) : products.map((item) => (
                      <tr key={item.code}>
                        <td><strong style={{ color: "#60a5fa" }}>{item.code}</strong><small style={{ display: "block", maxWidth: 380 }}>{item.product}</small></td>
                        <td>{item.category}</td>
                        <td>{item.frequency} docs.</td>
                        <td>{number(item.rotation)} un./mes</td>
                        <td><strong>{number(item.units)}</strong></td>
                        <td>{money(item.sale)}</td>
                        <td>{money(item.cost)}</td>
                        <td style={{ color: item.margin >= 0 ? "#22c55e" : "#ef4444" }}>{money(item.margin)} · {item.marginPct.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === "formulas" && (
            <div className="card">
              <h2 className="card-title">Revisión de fórmulas e indicadores</h2>
              <p className="page-subtitle">Criterios utilizados por el reporte. Los porcentajes se calculan de forma ponderada.</p>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Indicador</th><th>Fórmula</th><th>Fuente / criterio</th><th>Estado</th></tr></thead>
                  <tbody>
                    {analytics.formulas.map((item) => (
                      <tr key={item.metric}>
                        <td><strong>{item.metric}</strong></td>
                        <td>{item.formula}</td>
                        <td>{item.source}</td>
                        <td><span className={`badge ${item.status === "pendiente" ? "badge-orange" : item.status === "corregida" ? "badge-blue" : "badge-green"}`}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {selectedCustomer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3,10,24,.72)", zIndex: 100, display: "grid", placeItems: "center", padding: 20 }} onClick={() => setSelectedCustomer(null)}>
          <section className="card" style={{ width: "min(1100px,96vw)", maxHeight: "88vh", overflow: "auto" }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <span className="badge badge-blue">{selectedCustomer.zone}</span>
                <h2 style={{ margin: "10px 0 4px" }}>{selectedCustomer.customer}</h2>
                <p className="page-subtitle">{selectedCustomer.code} · {selectedCustomer.seller} · {selectedCustomer.frequency} documentos</p>
              </div>
              <button className="btn btn-ghost" onClick={() => setSelectedCustomer(null)} aria-label="Cerrar"><X size={17} /></button>
            </div>
            <div className="kpi-grid">
              <div className="kpi-card blue"><div className="kpi-label">Importe comprado</div><div className="kpi-value">{money(selectedCustomer.sale)}</div></div>
              <div className="kpi-card blue"><div className="kpi-label">Unidades</div><div className="kpi-value">{number(selectedCustomer.units)}</div></div>
              <div className="kpi-card green"><div className="kpi-label">Margen</div><div className="kpi-value">{selectedCustomer.marginPct.toFixed(1)}%</div></div>
              <div className="kpi-card orange"><div className="kpi-label">Rotación estimada</div><div className="kpi-value">{number(selectedCustomer.rotation)}</div><div className="kpi-unit">unidades / mes</div></div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Código / producto</th><th>Cantidad</th><th>Importe</th><th>Costo</th><th>Margen</th><th>Frecuencia</th><th>Rotación</th></tr></thead>
                <tbody>
                  {selectedCustomer.products.map((product) => (
                    <tr key={product.code}>
                      <td><strong style={{ color: "#60a5fa" }}>{product.code}</strong><small style={{ display: "block" }}>{product.product}</small></td>
                      <td>{number(product.units)}</td>
                      <td>{money(product.sale)}</td>
                      <td>{money(product.cost)}</td>
                      <td>{money(product.margin)} · {product.marginPct.toFixed(1)}%</td>
                      <td>{product.frequency} compras</td>
                      <td>{number(product.rotation)} un./mes</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
