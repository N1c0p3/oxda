"use client";

import { useEffect, useState } from "react";
import {
  AreaChartComponent,
  BarChartComponent,
  LineChartComponent,
  PieChartComponent,
  StatCard,
  ChartCard,
} from "@/components/charts";
import {
  DollarSign,
  Target,
  TrendingUp,
  Users,
  Award,
  Building2,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

type DivisionResumen = { division: string; presupuesto: number; real: number; avance: number; mscp: number; mscpPct: number };
type VentaMensual = { mes: string; venta: number; unidades: number };
type TopCliente = { cliente: string; cajas: number; venta: number; margen: number; margenPct: number };
type VentaCanal = { canal: string; venta: number; porcentaje: number };
type TopVendedor = { nombre: string; ventas: number; porcentaje: number };
type TotalesGlobales = { ventaTotal: number; unidadesTotal: number; presupuestoTotal: number; realTotal: number; avanceGlobal: number; mscpTotal: number; mscpPromedio: number };

type ResumenData = {
  divisiones: DivisionResumen[];
  ventasMensuales: VentaMensual[];
  topClientes: TopCliente[];
  ventasCanal: VentaCanal[];
  topVendedores: TopVendedor[];
  totales: TotalesGlobales;
};

const defaultResumen: ResumenData = {
  divisiones: [],
  ventasMensuales: [],
  topClientes: [],
  ventasCanal: [],
  topVendedores: [],
  totales: { ventaTotal: 0, unidadesTotal: 0, presupuestoTotal: 0, realTotal: 0, avanceGlobal: 0, mscpTotal: 0, mscpPromedio: 0 },
};

export default function ResumenPage() {
  const [periodo, setPeriodo] = useState("2026");
  const [resumen, setResumen] = useState<ResumenData>(defaultResumen);

  const resumenDivisiones = resumen.divisiones;
  const ventasMensuales = resumen.ventasMensuales;
  const topClientes = resumen.topClientes;
  const ventasPorCanal = resumen.ventasCanal;
  const topVendedoresGlobal = resumen.topVendedores;
  const totalesGlobales = resumen.totales;

  useEffect(() => {
    fetch(`/api/v1/resumen?periodo=${periodo}`)
      .then((res) => res.json())
      .then((data: Partial<ResumenData>) => setResumen({ ...defaultResumen, ...data }))
      .catch(() => setResumen(defaultResumen));
  }, [periodo]);

  return (
    <div style={{ padding: "24px 28px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", margin: "0 0 6px 0" }}>
              Resumen Ejecutivo Corporativo
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>
              Consolidado OXDA + VULPES | Enero - Mayo 2026
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              style={{
                padding: "10px 16px",
                background: "rgba(0,48,135,0.15)",
                border: "1px solid rgba(0,48,135,0.3)",
                borderRadius: "10px",
                color: "#60a5fa",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
            <button style={{
              padding: "10px 16px",
              background: "rgba(0,48,135,0.15)",
              border: "1px solid rgba(0,48,135,0.3)",
              borderRadius: "10px",
              color: "#60a5fa",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <Download size={16} /> Exportar
            </button>
          </div>
        </div>
      </header>

      {/* KPIs Globales */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <StatCard
          title="Venta Total Anual"
          value={`$${(totalesGlobales.ventaTotal / 1000000).toFixed(2)}M`}
          subtitle="Ene - May 2026"
          trend="82,217 unidades"
          trendUp={true}
          icon={<DollarSign size={20} color="#60a5fa" />}
          color="blue"
        />
        <StatCard
          title="Presupuesto Mayo"
          value={`$${(totalesGlobales.presupuestoTotal / 1000000).toFixed(2)}M`}
          subtitle="Total divisones"
          trend={`${totalesGlobales.avanceGlobal}% avance`}
          trendUp={false}
          icon={<Target size={20} color="#f59e0b" />}
          color="orange"
        />
        <StatCard
          title="Venta Real Mayo"
          value={`$${(totalesGlobales.realTotal / 1000000).toFixed(2)}M`}
          subtitle="Al 13 de mayo"
          trend="40% del mes"
          trendUp={true}
          icon={<TrendingUp size={20} color="#22c55e" />}
          color="green"
        />
        <StatCard
          title="Margen Total"
          value={`$${(totalesGlobales.mscpTotal / 1000).toFixed(0)}K`}
          subtitle={`${totalesGlobales.mscpPromedio}% promedio`}
          trend="+2.1% vs obj."
          trendUp={true}
          icon={<Award size={20} color="#22c55e" />}
          color="green"
        />
        <StatCard
          title="Clientes Activos"
          value="94"
          subtitle="Top 50 ranked"
          trend="+18 nuevos"
          trendUp={true}
          icon={<Users size={20} color="#8b5cf6" />}
          color="purple"
        />
        <StatCard
          title="División Líder"
          value="CC CASTEL"
          subtitle="100% avance"
          trend="$621K ventas"
          trendUp={true}
          icon={<Building2 size={20} color="#f59e0b" />}
          color="orange"
        />
      </section>

      {/* Alertas */}
      <section style={{ marginBottom: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px",
            background: "rgba(239,68,68,0.1)", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.2)"
          }}>
            <AlertTriangle size={18} color="#ef4444" />
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#fff", fontWeight: 500 }}>
                MAY VLP con avance bajo (15%)
              </p>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                $117,981 de $766,144 presupuestado
              </p>
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px",
            background: "rgba(34,197,94,0.1)", borderRadius: "10px", border: "1px solid rgba(34,197,94,0.2)"
          }}>
            <CheckCircle size={18} color="#22c55e" />
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#fff", fontWeight: 500 }}>
                CC CASTEL y CC KAIDA1 al 100% de avance
              </p>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                Presupuesto completado al 13 de mayo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gráficas */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <ChartCard title="Ventas Mensuales 2026" subtitle="Enero - Mayo">
          <AreaChartComponent
            data={ventasMensuales}
            dataKeys={[{ key: "venta", name: "Ventas ($)", color: "#003087" }]}
            xAxisKey="mes"
            height={300}
          />
        </ChartCard>
        <ChartCard title="Distribución por Canal" subtitle="% participación">
          <PieChartComponent
            data={ventasPorCanal}
            dataKey="venta"
            nameKey="canal"
            height={300}
            donut={true}
          />
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <ChartCard title="Avance por División" subtitle="Presupuesto vs Real - Mayo 2026">
          <BarChartComponent
            data={resumenDivisiones}
            dataKeys={[
              { key: "presupuesto", name: "Presupuesto", color: "#00a0e3" },
              { key: "real", name: "Real", color: "#003087" },
            ]}
            xAxisKey="division"
            height={280}
          />
        </ChartCard>
        <ChartCard title="% Avance por División" subtitle="Cumplimiento presupuesto">
          <BarChartComponent
            data={resumenDivisiones}
            dataKeys={[{ key: "avance", name: "Avance %", color: "#22c55e" }]}
            xAxisKey="division"
            height={280}
          />
        </ChartCard>
      </div>

      {/* Tablas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <ChartCard title="Top 8 Clientes" subtitle="Por ventas - Ranking Cliente CSV">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(0,48,135,0.3)" }}>
                  <th style={{ textAlign: "left", padding: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Cliente</th>
                  <th style={{ textAlign: "center", padding: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Cajas</th>
                  <th style={{ textAlign: "right", padding: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Venta</th>
                  <th style={{ textAlign: "center", padding: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Margen</th>
                </tr>
              </thead>
              <tbody>
                {topClientes.map((cliente, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "10px", fontWeight: 500, color: "#fff", fontSize: "11px" }}>{cliente.cliente}</td>
                    <td style={{ padding: "10px", textAlign: "center", color: "rgba(255,255,255,0.8)" }}>{cliente.cajas.toLocaleString()}</td>
                    <td style={{ padding: "10px", textAlign: "right", color: "#60a5fa", fontWeight: 600 }}>${cliente.venta.toLocaleString()}</td>
                    <td style={{ padding: "10px", textAlign: "center", color: cliente.margenPct >= 20 ? "#22c55e" : cliente.margenPct >= 10 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>
                      {cliente.margenPct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Top Vendedores" subtitle="Por ventas - Tablas CSV">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(0,48,135,0.3)" }}>
                  <th style={{ textAlign: "left", padding: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Vendedor</th>
                  <th style={{ textAlign: "right", padding: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Ventas</th>
                  <th style={{ textAlign: "center", padding: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>%</th>
                </tr>
              </thead>
              <tbody>
                {topVendedoresGlobal.slice(0, 6).map((vendedor, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "10px", fontWeight: 500, color: "#fff" }}>
                      <span style={{ marginRight: "6px" }}>{idx === 0 ? "👑" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "•"}</span>
                      {vendedor.nombre}
                    </td>
                    <td style={{ padding: "10px", textAlign: "right", color: "#60a5fa", fontWeight: 600 }}>${vendedor.ventas.toLocaleString()}</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px" }}>
                          <div style={{ width: `${vendedor.porcentaje * 3}%`, height: "100%", background: idx === 0 ? "#f59e0b" : "#003087", borderRadius: "3px" }} />
                        </div>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", minWidth: "35px" }}>{vendedor.porcentaje}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* Tabla Detalle Divisiones */}
      <ChartCard title="Detalle por División - Mayo 2026" subtitle="Presupuesto vs Real (Resumen Global CSV)">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(0,48,135,0.3)" }}>
                <th style={{ textAlign: "left", padding: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>División</th>
                <th style={{ textAlign: "right", padding: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Presupuesto</th>
                <th style={{ textAlign: "right", padding: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Real</th>
                <th style={{ textAlign: "center", padding: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Avance</th>
                <th style={{ textAlign: "right", padding: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Margen $</th>
                <th style={{ textAlign: "center", padding: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Margen %</th>
                <th style={{ textAlign: "center", padding: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {resumenDivisiones.map((div, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "12px", fontWeight: 600, color: "#fff" }}>{div.division}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "rgba(255,255,255,0.8)" }}>${div.presupuesto.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#60a5fa", fontWeight: 600 }}>${div.real.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", width: "60px" }}>
                        <div style={{
                          width: `${div.avance}%`, height: "100%",
                          background: div.avance >= 80 ? "#22c55e" : div.avance >= 40 ? "#f59e0b" : "#ef4444",
                          borderRadius: "4px"
                        }} />
                      </div>
                      <span style={{ fontSize: "12px", color: div.avance >= 80 ? "#22c55e" : div.avance >= 40 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>
                        {div.avance}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#22c55e", fontWeight: 600 }}>${div.mscp.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "center", color: "rgba(255,255,255,0.8)" }}>{div.mscpPct}%</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                      background: div.avance >= 80 ? "rgba(34,197,94,0.15)" : div.avance >= 40 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                      color: div.avance >= 80 ? "#22c55e" : div.avance >= 40 ? "#f59e0b" : "#ef4444",
                    }}>
                      {div.avance >= 80 ? "ÓPTIMO" : div.avance >= 40 ? "EN PROCESO" : "CRÍTICO"}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ background: "rgba(0,48,135,0.15)", fontWeight: 700 }}>
                <td style={{ padding: "12px", color: "#fff" }}>TOTAL OXDA + VULPES</td>
                <td style={{ padding: "12px", textAlign: "right", color: "#fff" }}>${totalesGlobales.presupuestoTotal.toLocaleString()}</td>
                <td style={{ padding: "12px", textAlign: "right", color: "#60a5fa" }}>${totalesGlobales.realTotal.toLocaleString()}</td>
                <td style={{ padding: "12px", textAlign: "center", color: "#f59e0b" }}>{totalesGlobales.avanceGlobal}%</td>
                <td style={{ padding: "12px", textAlign: "right", color: "#22c55e" }}>${totalesGlobales.mscpTotal.toLocaleString()}</td>
                <td style={{ padding: "12px", textAlign: "center", color: "#fff" }}>{totalesGlobales.mscpPromedio}%</td>
                <td style={{ padding: "12px", textAlign: "center" }}>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Footer */}
      <footer style={{ marginTop: "32px", padding: "20px 24px", background: "rgba(0,48,135,0.08)", borderRadius: "12px", border: "1px solid rgba(0,48,135,0.2)", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>
          📊 Fuentes: Resumen Global-Tabla 1.csv | Ranking Cliente-Tabla 1.csv | Tablas-Tabla 1.csv | Ranking Producto-Tabla 1.csv | OXDA © 2026
        </p>
      </footer>
    </div>
  );
}
