"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  Calculator,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  Handshake,
  PackageCheck,
  ReceiptText,
  Ship,
  ShoppingCart,
  Target,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AreaChartComponent, BarChartComponent, ChartCard, StatCard } from "@/components/charts";
import { useProfile } from "@/components/profile-session";
import { useZone } from "@/components/zone-filter";

type DashboardAnalytics = {
  source?: { cutOff: string };
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
  customers: Array<{ code: string; customer: string; customerLabel: string; zone: string; sale: number; units: number }>;
  products: Array<{ code: string; product: string; sale: number; units: number }>;
  trend: Array<{ month: string; sale: number; units: number; factor: number | null }>;
};

type ZoneMetrics = {
  inventoryByZone: Record<string, { units: number; rotation: number; critical: number; transit: number; transitValue: number }>;
  receivablesByZone: Record<string, { total: number; overdue: number; dueSoon: number }>;
};

type QuickLink = {
  href: string;
  label: string;
  detail: string;
  icon: LucideIcon;
};

const money = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

const DASHBOARD_COPY = {
  direccion: {
    title: "Resumen ejecutivo",
    subtitle: "Visión consolidada de la empresa",
    action: "Abrir análisis",
    href: "/ventas/reporte",
  },
  contador: {
    title: "Dashboard de Contabilidad",
    subtitle: "Cartera, margen, facturación y compromisos financieros",
    action: "Revisar cartera",
    href: "/cobranza",
  },
  logistica: {
    title: "Dashboard de Logística y distribución",
    subtitle: "Inventario, preparación, tránsito y entregas",
    action: "Revisar envíos",
    href: "/logistica",
  },
  ventas: {
    title: "Dashboard de Ventas",
    subtitle: "Cumplimiento, pedidos, clientes y seguimiento comercial",
    action: "Abrir pedidos",
    href: "/ventas",
  },
};

function QuickLinks({ items }: { items: QuickLink[] }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 18 }}>
      {items.map(({ href, icon: Icon, label, detail }) => (
        <Link key={href} href={href} className="card" style={{ textDecoration: "none", padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <Icon size={22} color="#60a5fa" />
          <span><strong style={{ display: "block" }}>{label}</strong><small style={{ color: "var(--text-muted)" }}>{detail}</small></span>
          <ArrowRight size={15} style={{ marginLeft: "auto" }} />
        </Link>
      ))}
    </section>
  );
}

export default function DashboardPage() {
  const { zone } = useZone();
  const { profile } = useProfile();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [zoneMetrics, setZoneMetrics] = useState<ZoneMetrics>({ inventoryByZone: {}, receivablesByZone: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const inventoryByZone = zoneMetrics.inventoryByZone;
  const receivablesByZone = zoneMetrics.receivablesByZone;
  const inventory = zone === "TODAS"
    ? Object.values(inventoryByZone).reduce((total, item) => ({
        units: total.units + item.units,
        rotation: total.rotation + item.rotation,
        critical: total.critical + item.critical,
        transit: total.transit + item.transit,
        transitValue: total.transitValue + item.transitValue,
      }), { units: 0, rotation: 0, critical: 0, transit: 0, transitValue: 0 })
    : inventoryByZone[zone] ?? { units: 0, rotation: 0, critical: 0, transit: 0, transitValue: 0 };
  const inventoryRotation = zone === "TODAS"
    ? inventory.rotation / (Object.values(inventoryByZone).length || 1)
    : inventory.rotation;
  const receivables = zone === "TODAS"
    ? Object.values(receivablesByZone).reduce((total, item) => ({
        total: total.total + item.total,
        overdue: total.overdue + item.overdue,
        dueSoon: total.dueSoon + item.dueSoon,
      }), { total: 0, overdue: 0, dueSoon: 0 })
    : receivablesByZone[zone] ?? { total: 0, overdue: 0, dueSoon: 0 };
  const copy = DASHBOARD_COPY[profile.id];

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      fetch(`/api/v1/ventas/analitica?zone=${encodeURIComponent(zone)}&month=Acumulado`, { signal: controller.signal }),
      fetch("/api/v1/dashboard/zonas", { signal: controller.signal }),
    ])
      .then(async ([salesRes, zonesRes]) => {
        const salesPayload = await salesRes.json();
        if (!salesRes.ok) throw new Error(salesPayload.error || "No fue posible cargar el tablero.");
        setData(salesPayload);
        if (zonesRes.ok) setZoneMetrics(await zonesRes.json());
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
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-subtitle">
            {profile.name} · {copy.subtitle} · {zone === "TODAS" ? "todas las zonas" : `zona ${zone}`} · corte al {data?.source?.cutOff ? new Date(`${data.source.cutOff}T12:00:00`).toLocaleDateString("es-MX") : "último dato disponible"}
          </p>
        </div>
        <Link className="btn btn-primary" href={copy.href}>
          {copy.action} <ArrowRight size={15} />
        </Link>
      </header>

      {loading && <div className="card empty">Consolidando indicadores para {profile.department.toLowerCase()}…</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && data && profile.id === "direccion" && (
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
            <StatCard title="Inventario" value={inventory.units.toLocaleString("es-MX")} subtitle="cajas disponibles" trend={`${inventoryRotation.toFixed(1)}x rotación mensual`} trendUp icon={<Boxes size={20} color="#8b5cf6" />} color="purple" />
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
                <Link href="/inventarios/transito" style={{ textDecoration: "none" }}>
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
              <BarChartComponent data={data.customers.slice(0, 7)} dataKeys={[{ key: "sale", name: "Venta", color: "#003087" }]} xAxisKey="customerLabel" height={310} />
            </ChartCard>
            <ChartCard title={`Productos con mayor movimiento · ${zone}`} subtitle="Ranking por unidades facturadas">
              <BarChartComponent data={data.products.slice(0, 7)} dataKeys={[{ key: "units", name: "Unidades", color: "#00a0e3" }]} xAxisKey="code" height={310} />
            </ChartCard>
          </div>

          <QuickLinks items={[
            { href: "/ventas/reporte", icon: Users, label: "Clientes y productos", detail: "Desglose, frecuencia y rotación" },
            { href: "/inventarios/reporte", icon: PackageCheck, label: "Centro de inventarios", detail: "Cobertura, lotes y existencias" },
            { href: "/ventas", icon: ClipboardCheck, label: "Pedidos y picking", detail: "Avance de preparación" },
            { href: "/presupuestos/zona-producto", icon: Target, label: "Presupuestos", detail: "Objetivos por zona y producto" },
            { href: "/logistica", icon: Truck, label: "Logística", detail: "Rutas, envíos y entregas" },
            { href: "/ia", icon: ChartNoAxesCombined, label: "Análisis financiero", detail: "Ingresos, egresos y balance" },
          ]} />
        </>
      )}

      {!loading && data && profile.id === "contador" && (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(205px,1fr))", gap: 14, marginBottom: 20 }}>
            <StatCard title="Venta facturada" value={money(data.kpis.sale)} subtitle={`${data.kpis.orders} pedidos`} trend={`${data.kpis.marginPct.toFixed(1)}% margen`} trendUp={data.kpis.margin >= 0} icon={<CircleDollarSign size={20} color="#60a5fa" />} color="blue" />
            <StatCard title="Cartera total" value={money(receivables.total)} subtitle="saldo por cobrar" trend={`${money(receivables.overdue)} vencido`} trendUp={false} icon={<ReceiptText size={20} color="#f59e0b" />} color="orange" />
            <StatCard title="Próximo vencimiento" value={money(receivables.dueSoon)} subtitle="ventana de 7 días" trend="Requiere seguimiento" trendUp={false} icon={<AlertTriangle size={20} color="#ef4444" />} color="red" />
            <StatCard title="Margen ponderado" value={`${data.kpis.marginPct.toFixed(1)}%`} subtitle={money(data.kpis.margin)} trend={`Costo ${money(data.kpis.cost)}`} trendUp={data.kpis.margin >= 0} icon={<Calculator size={20} color="#22c55e" />} color="green" />
          </section>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(300px,1fr)", gap: 18 }}>
            <ChartCard title="Facturación mensual" subtitle={`Tendencia consolidada · ${zone}`}>
              <AreaChartComponent data={data.trend} dataKeys={[{ key: "sale", name: "Venta facturada", color: "#003087" }]} xAxisKey="month" height={300} />
            </ChartCard>
            <div className="card">
              <h2 className="card-title">Prioridades contables</h2>
              <div style={{ display: "grid", gap: 11 }}>
                <div className="alert alert-error"><ReceiptText size={16} /> {money(receivables.overdue)} de cartera vencida</div>
                <div className="alert" style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)" }}><AlertTriangle size={16} /> {money(receivables.dueSoon)} vence en 7 días</div>
                <div className="alert alert-success"><CircleDollarSign size={16} /> Margen acumulado {money(data.kpis.margin)}</div>
              </div>
            </div>
          </div>
          <QuickLinks items={[
            { href: "/cobranza", icon: ReceiptText, label: "Cartera de clientes", detail: "Vigente, vencida y próximos pagos" },
            { href: "/cuentas-por-pagar", icon: CreditCard, label: "Cuentas por pagar", detail: "Comisiones por autorizar y programar" },
            { href: "/costeo", icon: Calculator, label: "Costeo y precios", detail: "Costo puesto, precio y margen" },
            { href: "/ia", icon: ChartNoAxesCombined, label: "Análisis financiero", detail: "Ingresos, egresos y balance" },
          ]} />
        </>
      )}

      {!loading && data && profile.id === "logistica" && (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(205px,1fr))", gap: 14, marginBottom: 20 }}>
            <StatCard title="Inventario disponible" value={inventory.units.toLocaleString("es-MX")} subtitle="cajas en almacenes" trend={`${inventoryRotation.toFixed(1)}x rotación mensual`} trendUp icon={<Boxes size={20} color="#8b5cf6" />} color="purple" />
            <StatCard title="Cobertura crítica" value={inventory.critical.toLocaleString("es-MX")} subtitle="productos por atender" trend="Priorizar reabasto" trendUp={false} icon={<AlertTriangle size={20} color="#ef4444" />} color="red" />
            <StatCard title="En tránsito" value={inventory.transit.toLocaleString("es-MX")} subtitle={money(inventory.transitValue)} trend="Próximas recepciones" trendUp icon={<Ship size={20} color="#60a5fa" />} color="blue" />
            <StatCard title="Pedidos" value={data.kpis.orders.toLocaleString("es-MX")} subtitle={`${data.kpis.units.toLocaleString("es-MX")} unidades vendidas`} trend="Revisar preparación" trendUp icon={<ClipboardCheck size={20} color="#22c55e" />} color="green" />
          </section>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(300px,1fr)", gap: 18 }}>
            <ChartCard title="Productos con mayor movimiento" subtitle={`Unidades facturadas · ${zone}`}>
              <BarChartComponent data={data.products.slice(0, 8)} dataKeys={[{ key: "units", name: "Unidades", color: "#00a0e3" }]} xAxisKey="code" height={310} />
            </ChartCard>
            <div className="card">
              <h2 className="card-title">Atención operativa</h2>
              <div style={{ display: "grid", gap: 11 }}>
                <div className="alert alert-error"><AlertTriangle size={16} /> {inventory.critical} productos con cobertura crítica</div>
                <div className="alert" style={{ background: "rgba(139,92,246,.12)", border: "1px solid rgba(139,92,246,.22)" }}><Ship size={16} /> {inventory.transit.toLocaleString("es-MX")} cajas en tránsito</div>
                <div className="alert alert-success"><ClipboardCheck size={16} /> {data.kpis.orders} pedidos en el periodo</div>
              </div>
            </div>
          </div>
          <QuickLinks items={[
            { href: "/inventarios/reporte", icon: Boxes, label: "Centro de inventarios", detail: "Cobertura y existencias por almacén" },
            { href: "/inventarios/transito", icon: Ship, label: "Inventario en tránsito", detail: "Llegadas y valor de mercancía" },
            { href: "/ventas", icon: ClipboardCheck, label: "Pedidos y picking", detail: "Preparación de pedidos" },
            { href: "/logistica", icon: Truck, label: "Envíos y seguimiento", detail: "Rutas, unidades y entregas" },
            { href: "/logistica/prediccion", icon: Target, label: "Predicción y reabasto", detail: "Demanda, cobertura y compra sugerida" },
          ]} />
        </>
      )}

      {!loading && data && profile.id === "ventas" && (
        <>
          <section className="card" style={{ marginBottom: 18, padding: 18, background: "linear-gradient(120deg,rgba(0,48,135,.34),rgba(0,160,227,.12))" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1fr) minmax(280px,2fr)", gap: 22, alignItems: "center" }}>
              <div>
                <p className="kpi-label">Cumplimiento de venta · {zone}</p>
                <p style={{ fontSize: "clamp(2rem,5vw,3.8rem)", lineHeight: 1, fontWeight: 850, margin: "8px 0" }}>
                  {data.kpis.achievementPct === null ? "Sin meta" : `${data.kpis.achievementPct.toFixed(1)}%`}
                </p>
                <p className="page-subtitle">{money(data.kpis.budgetComparableSale)} comparable de {data.kpis.budget ? money(data.kpis.budget) : "meta no configurada"}</p>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 7 }}>
                  <span>Avance comercial</span>
                  <strong>{data.kpis.achievementPct === null ? "—" : `${Math.max(0, 100 - data.kpis.achievementPct).toFixed(1)}% pendiente`}</strong>
                </div>
                <div style={{ height: 16, background: "rgba(255,255,255,.12)", borderRadius: 20, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, data.kpis.achievementPct ?? 0)}%`, borderRadius: 20, background: "linear-gradient(90deg,#00a0e3,#60a5fa)" }} />
                </div>
              </div>
            </div>
          </section>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(205px,1fr))", gap: 14, marginBottom: 20 }}>
            <StatCard title="Venta" value={money(data.kpis.sale)} subtitle={`${data.kpis.units.toLocaleString("es-MX")} unidades`} trend={`${data.kpis.marginPct.toFixed(1)}% margen`} trendUp={data.kpis.margin >= 0} icon={<CircleDollarSign size={20} color="#60a5fa" />} color="blue" />
            <StatCard title="Pedidos" value={data.kpis.orders.toLocaleString("es-MX")} subtitle={`${data.kpis.customers} clientes`} trend="Actividad comercial" trendUp icon={<ShoppingCart size={20} color="#22c55e" />} color="green" />
            <StatCard title="Ticket promedio" value={money(data.kpis.averageTicket)} subtitle="por pedido" trend="Venta acumulada" trendUp icon={<Target size={20} color="#8b5cf6" />} color="purple" />
            <StatCard title="Próximo a vencer" value={money(receivables.dueSoon)} subtitle="cartera en 7 días" trend="Dar seguimiento" trendUp={false} icon={<ReceiptText size={20} color="#f59e0b" />} color="orange" />
          </section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))", gap: 18 }}>
            <ChartCard title={`Clientes líderes · ${zone}`} subtitle="Ranking por venta neta facturada">
              <BarChartComponent data={data.customers.slice(0, 7)} dataKeys={[{ key: "sale", name: "Venta", color: "#003087" }]} xAxisKey="customerLabel" height={310} />
            </ChartCard>
            <ChartCard title={`Productos líderes · ${zone}`} subtitle="Ranking por unidades facturadas">
              <BarChartComponent data={data.products.slice(0, 7)} dataKeys={[{ key: "units", name: "Unidades", color: "#00a0e3" }]} xAxisKey="code" height={310} />
            </ChartCard>
          </div>
          <QuickLinks items={[
            { href: "/ventas/reporte", icon: BarChart3, label: "Salón de Ventas", detail: "Clientes, productos y tendencias" },
            { href: "/ventas", icon: ShoppingCart, label: "Pedidos", detail: "Captura y seguimiento de preparación" },
            { href: "/crm", icon: Handshake, label: "Prospectos y CRM", detail: "Pipeline y próximas acciones" },
            { href: "/cobranza", icon: ReceiptText, label: "Cartera", detail: "Saldos y próximos vencimientos" },
            { href: "/presupuestos/zona-producto", icon: Target, label: "Presupuestos", detail: "Meta por zona y producto" },
            { href: "/logistica", icon: Truck, label: "Seguimiento de envíos", detail: "Estado de entrega al cliente" },
          ]} />
        </>
      )}
    </div>
  );
}
