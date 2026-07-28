"use client";

import { BarChartComponent, LineChartComponent, StatCard, ChartCard } from "@/components/charts";
import { Target, TrendingUp, AlertTriangle, DollarSign, CheckCircle, XCircle, Calendar } from "lucide-react";

// Datos reales de Resumen Global-Tabla 1.csv: Presupuesto vs Real Mayo 2026
const ventasVsPresupuesto = [
  { division: "GDL", presupuesto: 976665, real: 323732, diferencia: -652933, avance: 33 },
  { division: "QR", presupuesto: 941850, real: 202470, diferencia: -739380, avance: 21 },
  { division: "CS", presupuesto: 727054, real: 177115, diferencia: -549939, avance: 24 },
  { division: "CC CASTEL", presupuesto: 621000, real: 621000, diferencia: 0, avance: 100 },
  { division: "CC KAIDA1", presupuesto: 316800, real: 316800, diferencia: 0, avance: 100 },
  { division: "MEN VLP", presupuesto: 902885, real: 367622, diferencia: -535263, avance: 41 },
  { division: "MAY VLP", presupuesto: 766144, real: 117981, diferencia: -648163, avance: 15 },
];

// Histórico mensual acumulado (Tablas-Tabla 1.csv + Objetivos)
const historialMensual = [
  { mes: "Enero", presupuesto: 7977055, real: 6328368 },
  { mes: "Febrero", presupuesto: 7081648, real: 7444180 },
  { mes: "Marzo", presupuesto: 6753114, real: 7193476 },
  { mes: "Abril", presupuesto: 7156798, real: 5736381 },
  { mes: "Mayo", presupuesto: 7156798, real: 2126719 },
];

export default function VentasVsPresupuestoPage() {
  const totalPresupuesto = ventasVsPresupuesto.reduce((acc, d) => acc + d.presupuesto, 0);
  const totalReal = ventasVsPresupuesto.reduce((acc, d) => acc + d.real, 0);
  const totalDiferencia = totalReal - totalPresupuesto;
  const avanceGlobal = Math.round((totalReal / totalPresupuesto) * 100);

  return (
    <div style={{ padding: "24px 28px", maxWidth: "1600px", margin: "0 auto" }}>
      <header style={{ marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", margin: "0 0 6px 0" }}>
            <Target size={28} style={{ verticalAlign: "middle", marginRight: "10px" }} />
            Ventas vs Presupuesto
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>
            Comparativo mensual y por división • Mayo 2026
          </p>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <StatCard title="Presupuesto Total" value={`$${(totalPresupuesto / 1000000).toFixed(2)}M`} subtitle="7 divisiones Mayo" trend="Meta mensual" trendUp={true} icon={<Target size={20} color="#f59e0b" />} color="orange" />
        <StatCard title="Ventas Reales" value={`$${(totalReal / 1000000).toFixed(2)}M`} subtitle="Al 13 de mayo" trend={`${avanceGlobal}% avance`} trendUp={false} icon={<TrendingUp size={20} color="#22c55e" />} color="green" />
        <StatCard title="Diferencia" value={`$${(Math.abs(totalDiferencia) / 1000000).toFixed(2)}M`} subtitle={totalDiferencia < 0 ? "Bajo presupuesto" : "Sobre presupuesto"} trend={totalDiferencia < 0 ? "-70% gap" : "+70%"} trendUp={totalDiferencia >= 0} icon={totalDiferencia < 0 ? <AlertTriangle size={20} color="#ef4444" /> : <CheckCircle size={20} color="#22c55e" />} color={totalDiferencia < 0 ? "red" : "green"} />
        <StatCard title="División Mejor" value="CC CASTEL" subtitle="100% cumplimiento" trend="$621K / $621K" trendUp={true} icon={<CheckCircle size={20} color="#22c55e" />} color="green" />
        <StatCard title="División Crítica" value="MAY VLP" subtitle="15% cumplimiento" trend="$118K / $766K" trendUp={false} icon={<XCircle size={20} color="#ef4444" />} color="red" />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <ChartCard title="Histórico Ventas vs Presupuesto" subtitle="Enero - Mayo 2026">
          <BarChartComponent
            data={historialMensual}
            dataKeys={[
              { key: "presupuesto", name: "Presupuesto", color: "#003087" },
              { key: "real", name: "Real", color: "#00a0e3" },
            ]}
            xAxisKey="mes"
            height={320}
          />
        </ChartCard>
        <ChartCard title="Avance Global" subtitle="% de cumplimiento acumulado">
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "320px" }}>
            <div style={{ position: "relative", width: "200px", height: "200px" }}>
              <svg viewBox="0 0 36 36" style={{ width: "200px", height: "200px", transform: "rotate(-90deg)" }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray={`${avanceGlobal}, 100`} />
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                <p style={{ fontSize: "36px", fontWeight: 800, color: "#22c55e", margin: 0 }}>{avanceGlobal}%</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0 }}>Avance</p>
              </div>
            </div>
            <p style={{ marginTop: "16px", color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
              <Calendar size={14} style={{ verticalAlign: "middle", marginRight: "6px" }} />
              Al 13 de mayo 2026
            </p>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Comparativo por División" subtitle="Mayo 2026 - Presupuesto vs Real">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "rgba(0,48,135,0.1)" }}>
                <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>División</th>
                <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Presupuesto</th>
                <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Real</th>
                <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Diferencia</th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Avance</th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ventasVsPresupuesto.map((d, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "14px", fontWeight: 600, color: "#fff" }}>{d.division}</td>
                  <td style={{ padding: "14px", textAlign: "right", color: "rgba(255,255,255,0.8)" }}>${d.presupuesto.toLocaleString()}</td>
                  <td style={{ padding: "14px", textAlign: "right", color: "#60a5fa", fontWeight: 600 }}>${d.real.toLocaleString()}</td>
                  <td style={{ padding: "14px", textAlign: "right", color: d.diferencia < 0 ? "#ef4444" : "#22c55e", fontWeight: 600 }}>
                    {d.diferencia < 0 ? "-" : "+"}${Math.abs(d.diferencia).toLocaleString()}
                  </td>
                  <td style={{ padding: "14px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                      <div style={{ width: "80px", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }}>
                        <div style={{ width: `${d.avance}%`, height: "100%", background: d.avance >= 80 ? "#22c55e" : d.avance >= 40 ? "#f59e0b" : "#ef4444", borderRadius: "4px" }} />
                      </div>
                      <span style={{ fontSize: "12px", color: d.avance >= 80 ? "#22c55e" : d.avance >= 40 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>{d.avance}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px", textAlign: "center" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                      background: d.avance >= 80 ? "rgba(34,197,94,0.15)" : d.avance >= 40 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                      color: d.avance >= 80 ? "#22c55e" : d.avance >= 40 ? "#f59e0b" : "#ef4444",
                    }}>
                      {d.avance >= 80 ? "CUMPLE" : d.avance >= 40 ? "EN PROCESO" : "CRÍTICO"}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ background: "rgba(0,48,135,0.15)", fontWeight: 700 }}>
                <td style={{ padding: "14px", color: "#fff" }}>TOTAL</td>
                <td style={{ padding: "14px", textAlign: "right", color: "#fff" }}>${totalPresupuesto.toLocaleString()}</td>
                <td style={{ padding: "14px", textAlign: "right", color: "#60a5fa" }}>${totalReal.toLocaleString()}</td>
                <td style={{ padding: "14px", textAlign: "right", color: totalDiferencia < 0 ? "#ef4444" : "#22c55e" }}>
                  {totalDiferencia < 0 ? "-" : "+"}${Math.abs(totalDiferencia).toLocaleString()}
                </td>
                <td style={{ padding: "14px", textAlign: "center", color: "#f59e0b" }}>{avanceGlobal}%</td>
                <td style={{ padding: "14px", textAlign: "center" }}>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
