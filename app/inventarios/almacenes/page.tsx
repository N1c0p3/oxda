"use client";

import { useState } from "react";
import { BarChartComponent, PieChartComponent, StatCard, ChartCard } from "@/components/charts";
import { Warehouse, Package, TrendingDown, AlertTriangle, CheckCircle, Search, MapPin, Box } from "lucide-react";

// Datos reales Mayo 2026 por almacén/bodega del CSV INVENTARIOS-OXDA-MAYO-2026
const almacenesData = [
  { almacen: "Abastos Logicos", valor: 743039, cajas: 2692, costoProm: 276, ventasMes: 493, llegadas: 4644, ventasEst: 2000, cobertura: 2.67, status: "Óptimo" },
  { almacen: "CDMX: Arcosa/Fresco/Frigarsa/Canbelt", valor: 2089695, cajas: 5626, costoProm: 371, ventasMes: 411, llegadas: 3024, ventasEst: 1200, cobertura: 6.21, status: "Óptimo" },
  { almacen: "Bajo Cero", valor: 1358076, cajas: 4926, costoProm: 276, ventasMes: 0, llegadas: 2622, ventasEst: 1000, cobertura: 7.93, status: "Exceso" },
  { almacen: "Frjalisco", valor: 1231168, cajas: 4584, costoProm: 269, ventasMes: 3410, llegadas: 1185, ventasEst: 2800, cobertura: 1.06, status: "Crítico" },
  { almacen: "Alfrimex", valor: 94931, cajas: 356, costoProm: 267, ventasMes: 158, llegadas: 0, ventasEst: 50, cobertura: 6.12, status: "Óptimo" },
  { almacen: "Vulpes", valor: 307923, cajas: 981, costoProm: 314, ventasMes: 0, llegadas: 0, ventasEst: 0, cobertura: 0, status: "Sin movimiento" },
];

export default function InventariosAlmacenesPage() {
  const [filtro, setFiltro] = useState("");

  const almacenesFiltrados = filtro
    ? almacenesData.filter((a) => a.almacen.toLowerCase().includes(filtro.toLowerCase()))
    : almacenesData;

  const totalValor = almacenesData.reduce((acc, a) => acc + a.valor, 0);
  const totalCajas = almacenesData.reduce((acc, a) => acc + a.cajas, 0);
  const totalLlegadas = almacenesData.reduce((acc, a) => acc + a.llegadas, 0);

  return (
    <div style={{ padding: "24px 28px", maxWidth: "1600px", margin: "0 auto" }}>
      <header style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", margin: "0 0 6px 0" }}>
              <Warehouse size={28} style={{ verticalAlign: "middle", marginRight: "10px" }} />
              Inventarios por Almacenes
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>
              Saldos por bodega al cierre de Mayo 2026
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.3)", padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Search size={16} color="rgba(255,255,255,0.5)" />
              <input
                type="text"
                placeholder="Buscar almacén..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "13px", outline: "none", width: "200px" }}
              />
            </div>
          </div>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <StatCard title="Valor Total Inventario" value={`$${(totalValor / 1000000).toFixed(2)}M`} subtitle="En 6 almacenes" trend="Mayo 2026" trendUp={true} icon={<Box size={20} color="#60a5fa" />} color="blue" />
        <StatCard title="Cajas en Stock" value={totalCajas.toLocaleString()} subtitle="Unidades físicas" trend="+llegadas pendientes" trendUp={true} icon={<Package size={20} color="#22c55e" />} color="green" />
        <StatCard title="Llegadas Previstas" value={totalLlegadas.toLocaleString()} subtitle="Cajas en tránsito" trend="+$1.2M valor" trendUp={true} icon={<TrendingDown size={20} color="#f59e0b" />} color="orange" />
        <StatCard title="Almacén Crítico" value="Frjalisco" subtitle="1.06 meses cobertura" trend="Requiere atención" trendUp={false} icon={<AlertTriangle size={20} color="#ef4444" />} color="red" />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <ChartCard title="Valor de Inventario por Almacén" subtitle="Mayo 2026">
          <BarChartComponent data={almacenesData} dataKeys={[{ key: "valor", name: "Valor ($)", color: "#003087" }]} xAxisKey="almacen" height={300} />
        </ChartCard>
        <ChartCard title="Distribución por Almacén" subtitle="% participación valor">
          <PieChartComponent data={almacenesData} dataKey="valor" nameKey="almacen" height={300} donut={true} />
        </ChartCard>
      </div>

      <ChartCard title="Detalle por Almacén" subtitle="Inventario, llegadas y cobertura">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "rgba(0,48,135,0.1)" }}>
                <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Almacén</th>
                <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Valor</th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Cajas</th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Costo Prom.</th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Ventas Mes</th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Llegadas</th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Cobertura</th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {almacenesFiltrados.map((a, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "14px", fontWeight: 600, color: "#fff" }}>
                    <MapPin size={14} color="#60a5fa" style={{ marginRight: "6px", verticalAlign: "middle" }} />
                    {a.almacen}
                  </td>
                  <td style={{ padding: "14px", textAlign: "right", color: "#60a5fa", fontWeight: 600 }}>${a.valor.toLocaleString()}</td>
                  <td style={{ padding: "14px", textAlign: "center", color: "rgba(255,255,255,0.8)" }}>{a.cajas.toLocaleString()}</td>
                  <td style={{ padding: "14px", textAlign: "center", color: "rgba(255,255,255,0.8)" }}>${a.costoProm}</td>
                  <td style={{ padding: "14px", textAlign: "center", color: "rgba(255,255,255,0.8)" }}>{a.ventasMes.toLocaleString()}</td>
                  <td style={{ padding: "14px", textAlign: "center", color: "#f59e0b", fontWeight: 600 }}>{a.llegadas.toLocaleString()}</td>
                  <td style={{ padding: "14px", textAlign: "center", color: a.cobertura < 1.5 ? "#ef4444" : a.cobertura > 6 ? "#f59e0b" : "#22c55e", fontWeight: 600 }}>
                    {a.cobertura} meses
                  </td>
                  <td style={{ padding: "14px", textAlign: "center" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                      background: a.status === "Óptimo" ? "rgba(34,197,94,0.15)" : a.status === "Crítico" ? "rgba(239,68,68,0.15)" : a.status === "Exceso" ? "rgba(245,158,11,0.15)" : "rgba(100,116,139,0.15)",
                      color: a.status === "Óptimo" ? "#22c55e" : a.status === "Crítico" ? "#ef4444" : a.status === "Exceso" ? "#f59e0b" : "#64748b",
                    }}>
                      {a.status === "Óptimo" ? <CheckCircle size={11} style={{ marginRight: "4px", verticalAlign: "middle" }} /> : <AlertTriangle size={11} style={{ marginRight: "4px", verticalAlign: "middle" }} />}
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
