"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDollarSign,
  ClipboardCheck,
  PackageCheck,
  ReceiptText,
  ShoppingCart,
  Target,
  Users,
} from "lucide-react";
import { AreaChartComponent, BarChartComponent, ChartCard, StatCard } from "@/components/charts";
import { useZone } from "@/components/zone-filter";

type DashboardAnalytics = {
  kpis: {
    sale: number;
    budget: number;
    budgetComparableSale: number;
    achievementPct: number | null;
    units: number;
    cost: number;
    margin: number;
    marginPct: number;
    customers: number;
    orders: number;
    averageTicket: number;
  };
  customers: Array<{ code: string; customer: string; zone: string; sale: number; units: number }>;
  products: Array<{ code: string; product: string; sale: number; units: number }>;
  trend: Array<{ month: string; sale: number; units: number; factor: number | null }>;
};

const money = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

const inventoryByZone: Record<string, { units: number; rotation: number; critical: number; transit: number; transitValue: number }> = {
  GDL: { units: 2220, rotation: 1.21, critical: 0, transit: 1185, transitValue: 327060 },
  QR: { units: 565, rotation: 1.08, critical: 1, transit: 1512, transitValue: 468720 },
  CS: { units: 485, rotation: 1.12, critical: 1, transit: 1312, transitValue: 459200 },
  "MEN VLP": { units: 337, rotation: 0.91, critical: 0, transit: 0, transitValue: 0 },
  "MAY VLP": { units: 3636, rotation: 0.77, critical: 0, transit: 2268, transitValue: 614628 },
  "CC CASTEL": { units: 83, rotation: 1, critical: 1, transit: 0, transitValue: 0 },
  "CC KAIDA1": { units: 52, rotation: 0.98, critical: 1, transit: 0, transitValue: 0 },
  FARAON: { units: 177, rotation: 1, critical: 1, transit: 177, transitValue: 50445 },
  VERACRUZ: { units: 145, rotation: 1, critical: 1, transit: 0, transitValue: 0 },
};

const receivablesByZone: Record<string, { total: number; overdue: number; dueSoon: number }> = {
  GDL: { total: 101050, overdue: 0, dueSoon: 87400 },
  QR: { total: 65440, overdue: 0, dueSoon: 53200 },
  CS: { total: 36507, overdue: 36507, dueSoon: 0 },
  "MEN VLP": { total: 12143, overdue: 12143, dueSoon: 0 },
  "MAY VLP": { total: 19147, overdue: 19147, dueSoon: 0 },
  "CC CASTEL": { total: 55500, overdue: 55500, dueSoon: 0 },
};

export default function DashboardPage() {
  const { zone } = useZone();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const inventory = zone === "TODAS"
    ? Object.values(inventoryByZone).reduce((total, item) => ({ units: total.units + item.units, rotation: total.rotation + item.rotation, critical: total.critical + item.critical, transit: total.transit + item.transit, transitValue: total.transitValue + item.transitValue }), { units: 0, rotation: 0, critical: 0, transit: 0, transitValue: 0 })
    : inventoryByZone[zone] ?? { units: 0, rotation: 0, critical: 0, transit: 0, transitValue: 0 };
  if (zone === "TODAS") inventory.rotation = Object.values(inventoryByZone).reduce((sum, item) => sum + item.rotation, 0) / Object.values(inventoryByZone).length;
  const receivables = zone === "TODAS"
    ? Object.values(receivablesByZone).reduce((total, item) => ({ total: total.total + item.total, overdue: total.overdue + item.overdue, dueSoon: total.dueSoon + item.dueSoon }), { total: 0, overdue: 0, dueSoon: 0 })
    : receivablesByZone[zone] ?? { total: 0, overdue: 0, dueSoon: 0 };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/v1/ventas/analitica?zone=${encodeURIComponent(zone)}&month=May`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "No fue posible cargar el tablero.");
        setData(payload);
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") setError(fetchError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [zone]);

  return (
    <div className="page" style={{ padding: "4px 4px 32px" }}>
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h1 className="page-title">Dashboard OXDA</h1>
          <p className="page-subtitle">
            Mayo 2026 · {zone === "TODAS" ? "visión consolidada" : `zona ${zone}`} · facturación al 13/05/2026
          </p>
        </div>
        <Link className="btn btn-primary" href="/ventas/reporte">
          Abrir análisis <ArrowRight size={15} />
        </Link>
      </header>

      {loading && <div className="card empty">Consolidando indicadores por zona…</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && data && (
        <>
          <section className="card" style={{ marginBottom: 18, padding: 18, background: "linear-gradient(120deg,rgba(0,48,135,.34),rgba(0,160,227,.12))" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1fr) minmax(280px,2fr)", gap: 22, alignItems: "center" }}>
              <div>
                <p className="kpi-label">Venta vs presupuesto · {zone}</p>
                <p style={{ fontSize: "clamp(2rem,5vw,3.8rem)", lineHeight: 1, fontWeight: 850, margin: "8px 0" }}>
                  {data.kpis.achievementPct === null ? "Sin meta" : `${data.kpis.achievementPct.toFixed(1)}%`}
                </p>
                <p className="page-subtitle">{money(data.kpis.budgetComparableSale)} comparable de {data.kpis.budget ? money(data.kpis.budget) : "meta no configurada"}</p>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 7 }}>
                  <span>Avance de meta</span>
                  <strong>{data.kpis.achievementPct === null ? "—" : `${Math.max(0, 100 - data.kpis.achievementPct).toFixed(1)}% pendiente`}</strong>
                </div>
                <div style={{ height: 16, background: "rgba(255,255,255,.12)", borderRadius: 20, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(100, data.kpis.achievementPct ?? 0)}%`,
                    borderRadius: 20,
                    background: (data.kpis.achievementPct ?? 0) >= 100 ? "#22c55e" : "linear-gradient(90deg,#00a0e3,#60a5fa)",
                  }} />
                </div>
              </div>
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(205px,1fr))", gap: 14, marginBottom: 20 }}>
            <StatCard title="Ventas" value={money(data.kpis.sale)} subtitle={`${data.kpis.units.toLocaleString("es-MX")} unidades`} trend={`${data.kpis.marginPct.toFixed(1)}% margen ponderado`} trendUp={data.kpis.margin >= 0} icon={<CircleDollarSign size={20} color="#60a5fa" />} color="blue" />
            <StatCard title="Inventario" value={inventory.units.toLocaleString("es-MX")} subtitle="cajas disponibles" trend={`${inventory.rotation}x rotación mensual`} trendUp icon={<Boxes size={20} color="#8b5cf6" />} color="purple" />
            <StatCard title="Cartera" value={money(receivables.total)} subtitle={`${money(receivables.overdue)} vencido`} trend={`${money(receivables.dueSoon)} vence en 7 días`} trendUp={false} icon={<ReceiptText size={20} color="#f59e0b" />} color="orange" />
            <StatCard title="Pedidos" value={data.kpis.orders.toLocaleString("es-MX")} subtitle={`${data.kpis.customers} clientes`} trend={`Ticket ${money(data.kpis.averageTicket)}`} trendUp icon={<ShoppingCart size={20} color="#22c55e" />} color="green" />
          </section>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(300px,1fr)", gap: 18, marginBottom: 18 }}>
            <ChartCard title={`Venta facturada · ${zone}`} subtitle="Tendencia mensual desde los documentos de facturación">
              <AreaChartComponent data={data.trend} dataKeys={[{ key: "sale", name: "Venta", color: "#003087" }]} xAxisKey="month" height={300} />
            </ChartCard>
            <div className="card">
              <h2 className="card-title">Atención requerida</h2>
              <div style={{ display: "grid", gap: 11 }}>
                <Link href="/inventarios/reporte" style={{ textDecoration: "none" }}>
                  <div className="alert alert-error"><AlertTriangle size={16} /> {inventory.critical} productos con cobertura crítica</div>
                </Link>
                <Link href="/inventarios/reporte" style={{ textDecoration: "none" }}>
                  <div className="alert" style={{ background: "rgba(139,92,246,.12)", border: "1px solid rgba(139,92,246,.22)" }}><PackageCheck size={16} /> {inventory.transit.toLocaleString("es-MX")} cajas en tránsito ({money(inventory.transitValue)})</div>
                </Link>
                <Link href="/cobranza" style={{ textDecoration: "none" }}>
                  <div className="alert" style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)" }}><ReceiptText size={16} /> {money(receivables.dueSoon)} próximos a vencer</div>
                </Link>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))", gap: 18 }}>
            <ChartCard title={`Clientes líderes · ${zone}`} subtitle="Ranking por venta neta facturada">
              <BarChartComponent data={data.customers.slice(0, 7)} dataKeys={[{ key: "sale", name: "Venta", color: "#003087" }]} xAxisKey="customer" height={310} />
            </ChartCard>
            <ChartCard title={`Productos con mayor movimiento · ${zone}`} subtitle="Ranking por unidades facturadas">
              <BarChartComponent data={data.products.slice(0, 7)} dataKeys={[{ key: "units", name: "Unidades", color: "#00a0e3" }]} xAxisKey="code" height={310} />
            </ChartCard>
          </div>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 18 }}>
            {[
              { href: "/ventas/reporte", icon: Users, label: "Clientes y productos", detail: "Desglose, frecuencia y rotación" },
              { href: "/inventarios/reporte", icon: PackageCheck, label: "Centro de inventarios", detail: "Cobertura, lotes y tránsito" },
              { href: "/ventas", icon: ClipboardCheck, label: "Pedidos y picking", detail: "Avance de preparación" },
              { href: "/presupuestos/zona-producto", icon: Target, label: "Presupuestos", detail: "Objetivos por zona y producto" },
            ].map(({ href, icon: Icon, label, detail }) => (
              <Link key={href} href={href} className="card" style={{ textDecoration: "none", padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <Icon size={22} color="#60a5fa" />
                <span><strong style={{ display: "block" }}>{label}</strong><small style={{ color: "var(--text-muted)" }}>{detail}</small></span>
                <ArrowRight size={15} style={{ marginLeft: "auto" }} />
              </Link>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
