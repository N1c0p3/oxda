"use client";

import { useState } from "react";
import {
  AreaChartComponent,
  BarChartComponent,
  LineChartComponent,
  PieChartComponent,
  StatCard,
  ChartCard,
} from "@/components/charts";
import {
  TrendingUp,
  AlertTriangle,
  Target,
  Calendar,
  Filter,
  Download,
  PieChart,
  Activity,
  BarChart3,
  Layers,
} from "lucide-react";

// Datos de análisis
const analisisTendencias = [
  { periodo: "Semana 1", inventario: 5800000, ventas: 420000, rotacion: 1.45 },
  { periodo: "Semana 2", inventario: 5200000, ventas: 580000, rotacion: 1.89 },
  { periodo: "Semana 3", inventario: 4800000, ventas: 720000, rotacion: 2.35 },
  { periodo: "Semana 4", inventario: 4190810, ventas: 249636, rotacion: 1.77 },
];

const eficienciaClientes = [
  { cliente: "Abastos logicos", rotacion: 2.84, eficiencia: 85, stockIdeal: 3500 },
  { cliente: "CDMX Arcosa", rotacion: 1.45, eficiencia: 92, stockIdeal: 5200 },
  { cliente: "Bajo Cero", rotacion: 0.0, eficiencia: 65, stockIdeal: 3800 },
];

const proyeccionTrimestre = [
  { mes: "Mayo", escenario: "Conservador", valor: 6800000, probabilidad: 60 },
  { mes: "Mayo", escenario: "Optimista", valor: 7500000, probabilidad: 30 },
  { mes: "Junio", escenario: "Conservador", valor: 6200000, probabilidad: 55 },
  { mes: "Junio", escenario: "Optimista", valor: 7200000, probabilidad: 35 },
  { mes: "Julio", escenario: "Conservador", valor: 5800000, probabilidad: 50 },
  { mes: "Julio", escenario: "Optimista", valor: 7000000, probabilidad: 40 },
];

export default function AnalisisPage() {
  const [periodoAnalisis, setPeriodoAnalisis] = useState("mensual");

  return (
    <div style={{ padding: "24px 28px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "28px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#fff",
              margin: "0 0 6px 0",
            }}>
              Análisis Avanzado
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>
              Análisis de tendencias, proyecciones y eficiencia operativa
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <select
              value={periodoAnalisis}
              onChange={(e) => setPeriodoAnalisis(e.target.value)}
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
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
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
              <Download size={16} />
              Exportar
            </button>
          </div>
        </div>
      </header>

      {/* KPIs de Análisis */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "28px",
      }}>
        <StatCard
          title="Rotación Promedio"
          value="1.77x"
          subtitle="Mensual"
          trend="-15% vs objetivo 2.0x"
          trendUp={false}
          icon={<TrendingUp size={20} color="#f59e0b" />}
          color="orange"
        />
        <StatCard
          title="Eficiencia Global"
          value="81%"
          subtitle="Promedio ponderado"
          trend="+3% vs mes anterior"
          trendUp={true}
          icon={<Activity size={20} color="#22c55e" />}
          color="green"
        />
        <StatCard
          title="Días Inventario"
          value="16.9"
          subtitle="Promedio ponderado"
          trend="Óptimo: 15-20 días"
          trendUp={true}
          icon={<Calendar size={20} color="#60a5fa" />}
          color="blue"
        />
        <StatCard
          title="Clientes Críticos"
          value="1"
          subtitle="Cobertura < 3 días"
          trend="Requiere atención"
          trendUp={false}
          icon={<AlertTriangle size={20} color="#ef4444" />}
          color="red"
        />
      </section>

      {/* Gráficas de Análisis */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
        marginBottom: "20px",
      }}>
        <ChartCard title="Tendencia de Rotación" subtitle="Evolución semanal">
          <LineChartComponent
            data={analisisTendencias}
            dataKeys={[{ key: "rotacion", name: "Rotación (x)", color: "#003087" }]}
            xAxisKey="periodo"
            height={280}
          />
        </ChartCard>
        
        <ChartCard title="Inventario vs Ventas" subtitle="Comparativo valor">
          <BarChartComponent
            data={analisisTendencias}
            dataKeys={[
              { key: "inventario", name: "Inventario ($)", color: "#003087" },
              { key: "ventas", name: "Ventas ($)", color: "#00a0e3" },
            ]}
            xAxisKey="periodo"
            height={280}
          />
        </ChartCard>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
        marginBottom: "20px",
      }}>
        <ChartCard title="Eficiencia por Cliente" subtitle="% de optimización">
          <BarChartComponent
            data={eficienciaClientes}
            dataKeys={[{ key: "eficiencia", name: "Eficiencia %", color: "#22c55e" }]}
            xAxisKey="cliente"
            height={260}
          />
        </ChartCard>
        
        <ChartCard title="Proyección Trimestre" subtitle="Escenarios conservador vs optimista">
          <BarChartComponent
            data={proyeccionTrimestre}
            dataKeys={[
              { key: "valor", name: "Valor Proyectado", color: "#003087" },
            ]}
            xAxisKey="mes"
            height={260}
          />
        </ChartCard>
      </div>

      {/* Tabla de Análisis */}
      <section style={{
        background: "rgba(255,255,255,0.05)",
        borderRadius: "16px",
        padding: "20px",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <h3 style={{ margin: "0 0 16px 0", color: "#fff", fontSize: "16px", fontWeight: 700 }}>
          Análisis Detallado por Cliente
        </h3>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(0,48,135,0.3)" }}>
                <th style={{ textAlign: "left", padding: "12px", color: "rgba(255,255,255,0.6)" }}>Cliente</th>
                <th style={{ textAlign: "center", padding: "12px", color: "rgba(255,255,255,0.6)" }}>Rotación</th>
                <th style={{ textAlign: "center", padding: "12px", color: "rgba(255,255,255,0.6)" }}>Eficiencia</th>
                <th style={{ textAlign: "center", padding: "12px", color: "rgba(255,255,255,0.6)" }}>Stock Ideal</th>
                <th style={{ textAlign: "center", padding: "12px", color: "rgba(255,255,255,0.6)" }}>Estado</th>
                <th style={{ textAlign: "left", padding: "12px", color: "rgba(255,255,255,0.6)" }}>Recomendación</th>
              </tr>
            </thead>
            <tbody>
              {eficienciaClientes.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "12px", fontWeight: 600, color: "#fff" }}>{item.cliente}</td>
                  <td style={{ padding: "12px", textAlign: "center", color: "rgba(255,255,255,0.8)" }}>{item.rotacion}x</td>
                  <td style={{ padding: "12px", textAlign: "center", color: "#60a5fa", fontWeight: 600 }}>{item.eficiencia}%</td>
                  <td style={{ padding: "12px", textAlign: "center", color: "rgba(255,255,255,0.8)" }}>{item.stockIdeal.toLocaleString()} cajas</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: item.eficiencia >= 90 ? "rgba(34,197,94,0.15)" : item.eficiencia >= 70 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                      color: item.eficiencia >= 90 ? "#22c55e" : item.eficiencia >= 70 ? "#f59e0b" : "#ef4444",
                    }}>
                      {item.eficiencia >= 90 ? "EXCELENTE" : item.eficiencia >= 70 ? "REGULAR" : "CRÍTICO"}
                    </span>
                  </td>
                  <td style={{ padding: "12px", color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
                    {item.eficiencia >= 90 
                      ? "Mantener estrategia actual" 
                      : item.eficiencia >= 70 
                        ? "Revisar frecuencia de reposición" 
                        : "Urgente: redistribuir inventario"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
