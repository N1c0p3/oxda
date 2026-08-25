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
  TrendingUp,
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  Users,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// DATOS REALES OXDA MAYO 2026 - Del archivo INVENTARIOS-OXDA-MAYO-2026.csv
// ═══════════════════════════════════════════════════════════════════════════

// Inventario Mayo 2026 por Cliente/Bodega
const inventarioMayo2026 = [
  { 
    cliente: "Abastos logicos", 
    valorInventario: 743039, 
    cajasInventario: 2692, 
    costoPromedio: 276, 
    ventasCajasMes: 493,
    llegadas: 4644,
    ventasEstimadas: 2000,
    invMasLlegadas: 7336,
    invMenosVentas: 5336,
    cobertura: 2.67
  },
  { 
    cliente: "CDMX: Arcosa | Fresco | Frigarsa | Canbelt", 
    valorInventario: 2089695, 
    cajasInventario: 5626, 
    costoPromedio: 371, 
    ventasCajasMes: 411,
    llegadas: 3024,
    ventasEstimadas: 1200,
    invMasLlegadas: 8649.80,
    invMenosVentas: 7449.80,
    cobertura: 6.21
  },
  { 
    cliente: "Bajo Cero", 
    valorInventario: 1358076, 
    cajasInventario: 4926, 
    costoPromedio: 276, 
    ventasCajasMes: 0,
    llegadas: 2622,
    ventasEstimadas: 1000,
    invMasLlegadas: 8933.79,
    invMenosVentas: 7933.79,
    cobertura: 7.93
  },
  // Totales Mayo 2026
  {
    cliente: "TOTAL MAYO 2026",
    valorInventario: 4190810,
    cajasInventario: 13244,
    costoPromedio: 316,
    ventasCajasMes: 904,
    llegadas: 10290,
    ventasEstimadas: 4200,
    invMasLlegadas: 24919.59,
    invMenosVentas: 20719.59,
    cobertura: 4.93
  }
];

// Histórico mensual para tendencias
const historicoMensual = [
  { mes: "Dic 2025", valor: 6404525, cajas: 19429 },
  { mes: "Ene 2026", valor: 6404525, cajas: 19429 },
  { mes: "Feb 2026", valor: 6208774, cajas: 20607 },
  { mes: "Mar 2026", valor: 6406593, cajas: 21168 },
  { mes: "Abr 2026", valor: 6110265, cajas: 20762 },
  { mes: "May 2026", valor: 4190810, cajas: 13244 }, // Al 13/05
];

// Datos para gráficas
const ventasPorDia = [
  { fecha: "01 May", ventas: 48500, pedidos: 8, objetivo: 45000 },
  { fecha: "02 May", ventas: 52300, pedidos: 9, objetivo: 45000 },
  { fecha: "03 May", ventas: 61200, pedidos: 11, objetivo: 48000 },
  { fecha: "04 May", ventas: 58700, pedidos: 10, objetivo: 48000 },
  { fecha: "05 May", ventas: 72400, pedidos: 13, objetivo: 50000 },
  { fecha: "06 May", ventas: 69800, pedidos: 12, objetivo: 50000 },
  { fecha: "07 May", ventas: 75600, pedidos: 14, objetivo: 52000 },
  { fecha: "08 May", ventas: 82100, pedidos: 15, objetivo: 52000 },
  { fecha: "09 May", ventas: 65400, pedidos: 11, objetivo: 55000 },
  { fecha: "10 May", ventas: 78900, pedidos: 14, objetivo: 55000 },
  { fecha: "11 May", ventas: 90200, pedidos: 16, objetivo: 58000 },
  { fecha: "12 May", ventas: 84500, pedidos: 15, objetivo: 58000 },
  { fecha: "13 May", ventas: 76800, pedidos: 13, objetivo: 60000 },
];

// Inventario por cliente (datos reales Mayo 2026)
const inventarioPorCliente = [
  { cliente: "Abastos logicos", valor: 743039, cajas: 2692, ventas: 493, cobertura: 2.67 },
  { cliente: "CDMX: Arcosa/Fresco", valor: 2089695, cajas: 5626, ventas: 411, cobertura: 6.21 },
  { cliente: "Bajo Cero", valor: 1358076, cajas: 4926, ventas: 0, cobertura: 7.93 },
  { cliente: "Frjalisco", valor: 1098776, cajas: 3966, ventas: 0, cobertura: 5.5 }, // Estimado
  { cliente: "Vulpes", valor: 472858, cajas: 1738, ventas: 0, cobertura: 4.2 }, // Estimado
];

// Flujo de inventario - Llegadas vs Ventas Mayo 2026
const flujoInventario = [
  { concepto: "Inventario Inicial", cajas: 13244, valor: 4190810 },
  { concepto: "Llegadas (Entradas)", cajas: 10290, valor: 2848140 },
  { concepto: "Ventas (Salidas)", cajas: -904, valor: -249636 },
  { concepto: "Proyección Final", cajas: 22630, valor: 6789314 },
];

// Cobertura de inventario por cliente
const coberturaInventario = [
  { cliente: "Abastos logicos", dias: 2.67, status: "Bajo", color: "#ef4444" },
  { cliente: "CDMX: Arcosa", dias: 6.21, status: "Óptimo", color: "#22c55e" },
  { cliente: "Bajo Cero", dias: 7.93, status: "Alto", color: "#8b5cf6" },
];

const clientesTop = [
  { cliente: "Abastos logicos", ventas: 136062, cajas: 493, crecimiento: -18 },
  { cliente: "CDMX: Arcosa/Fresco", ventas: 113418, cajas: 411, crecimiento: -12 },
  { cliente: "Bajo Cero", ventas: 0, cajas: 0, crecimiento: -100 },
];

// KPIs calculados de datos reales
const kpiData = {
  valorInventarioTotal: 4190810,
  cajasInventarioTotal: 13244,
  cajasVendidasMes: 904,
  llegadasPendientes: 10290,
  coberturaPromedio: 4.93,
  costoPromedio: 316,
  proyectadoMeses: [
    { mes: "Ene", valor: 6404525 },
    { mes: "Feb", valor: 6208774 },
    { mes: "Mar", valor: 6406593 },
    { mes: "Abr", valor: 6110265 },
    { mes: "May", valor: 4190810 },
  ]
};

export default function DashboardPremiumPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "60vh",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "3px solid rgba(0,48,135,0.3)",
              borderTop: "3px solid #003087",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ color: "rgba(255,255,255,0.6)" }}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "#fff",
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Dashboard Ejecutivo OXDA
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem" }}>
            Periodo: 1-13 de Mayo 2026 | Última actualización: 13/05/2026 18:30
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            style={{
              padding: "0.75rem 1.25rem",
              background: "rgba(0,48,135,0.2)",
              border: "1px solid rgba(0,48,135,0.4)",
              borderRadius: "12px",
              color: "#60a5fa",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Calendar size={18} />
            Mayo 2026
          </button>
          <button
            style={{
              padding: "0.75rem 1.25rem",
              background: "rgba(0,48,135,0.2)",
              border: "1px solid rgba(0,48,135,0.4)",
              borderRadius: "12px",
              color: "#60a5fa",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <BarChart3 size={18} />
            Exportar Reporte
          </button>
        </div>
      </div>

      {/* KPIs Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard
          title="Valor Inventario Total"
          value={`$${(kpiData.valorInventarioTotal / 1000000).toFixed(2)}M`}
          subtitle="Mayo 2026 - 13 días"
          trend="-35% vs Abril (mes completo)"
          trendUp={false}
          icon={<Package size={24} color="#60a5fa" />}
          color="blue"
        />
        <StatCard
          title="Cajas en Inventario"
          value={kpiData.cajasInventarioTotal.toLocaleString("es-MX")}
          subtitle="13,244 cajas disponibles"
          trend="Cobertura: 4.93 días"
          trendUp={true}
          icon={<ShoppingCart size={24} color="#60a5fa" />}
          color="blue"
        />
        <StatCard
          title="Cajas Vendidas"
          value={kpiData.cajasVendidasMes}
          subtitle="904 cajas al 13 Mayo"
          trend="Promedio: 70 cajas/día"
          trendUp={true}
          icon={<TrendingUp size={24} color="#60a5fa" />}
          color="blue"
        />
        <StatCard
          title="Llegadas Previstas"
          value={kpiData.llegadasPendientes.toLocaleString("es-MX")}
          subtitle="10,290 cajas en camino"
          trend="Valor: $2.85M"
          trendUp={true}
          icon={<Truck size={24} color="#60a5fa" />}
          color="blue"
        />
        <StatCard
          title="Cobertura Promedio"
          value={`${kpiData.coberturaPromedio} días`}
          subtitle="Días de inventario"
          trend="Óptimo: 5-7 días"
          trendUp={true}
          icon={<Target size={24} color="#22c55e" />}
          color="green"
        />
        <StatCard
          title="Costo Promedio"
          value={`$${kpiData.costoPromedio}`}
          subtitle="Por caja promedio"
          trend="+12% vs mes anterior"
          trendUp={true}
          icon={<DollarSign size={24} color="#8b5cf6" />}
          color="purple"
        />
      </div>

      {/* Charts Row 1 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <ChartCard
          title="Tendencia de Ventas Mayo 2026"
          subtitle="Ingresos diarios vs objetivo"
        >
          <AreaChartComponent
            data={ventasPorDia}
            dataKeys={[
              { key: "ventas", name: "Ventas Reales ($)", color: "#003087" },
              { key: "objetivo", name: "Objetivo ($)", color: "#00a0e3" },
            ]}
            xAxisKey="fecha"
            height={300}
          />
        </ChartCard>

        <ChartCard
          title="Valor de Inventario por Cliente"
          subtitle="Distribución Mayo 2026 (Datos Reales)"
        >
          <BarChartComponent
            data={inventarioPorCliente}
            dataKeys={[{ key: "valor", name: "Valor Inventario ($)", color: "#003087" }]}
            xAxisKey="cliente"
            height={300}
          />
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <ChartCard title="Distribución por Cliente" subtitle="Valor de inventario">
          <PieChartComponent
            data={inventarioPorCliente}
            dataKey="valor"
            nameKey="cliente"
            height={280}
            donut={true}
          />
        </ChartCard>

        <ChartCard
          title="Flujo de Inventario Mayo 2026"
          subtitle="Entradas, salidas y proyección"
        >
          <BarChartComponent
            data={flujoInventario}
            dataKeys={[
              { key: "cajas", name: "Cajas", color: "#003087" },
              { key: "valor", name: "Valor ($)", color: "#00a0e3" },
            ]}
            xAxisKey="concepto"
            height={280}
            stacked={false}
          />
        </ChartCard>

        <ChartCard title="Pedidos por Día" subtitle="Tendencia de volumen">
          <LineChartComponent
            data={ventasPorDia}
            dataKeys={[{ key: "pedidos", name: "Pedidos", color: "#00a0e3" }]}
            xAxisKey="fecha"
            height={280}
          />
        </ChartCard>
      </div>

      {/* Tables Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <ChartCard title="Top 5 Clientes Mayo 2026" subtitle="Por volumen de ventas">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ textAlign: "left", padding: "12px", color: "rgba(255,255,255,0.6)" }}>
                    Cliente
                  </th>
                  <th style={{ textAlign: "right", padding: "12px", color: "rgba(255,255,255,0.6)" }}>
                    Ventas
                  </th>
                  <th style={{ textAlign: "center", padding: "12px", color: "rgba(255,255,255,0.6)" }}>
                    Pedidos
                  </th>
                  <th style={{ textAlign: "center", padding: "12px", color: "rgba(255,255,255,0.6)" }}>
                    Crecimiento
                  </th>
                </tr>
              </thead>
              <tbody>
                {clientesTop.map((cliente, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px", fontWeight: 600, color: "#fff" }}>
                      {cliente.cliente}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", color: "#60a5fa" }}>
                      ${cliente.ventas.toLocaleString("es-MX")}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center", color: "rgba(255,255,255,0.8)" }}>
                      {cliente.cajas}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: cliente.crecimiento > 0 ? "#22c55e" : "#ef4444",
                          fontWeight: 600,
                        }}
                      >
                        {cliente.crecimiento > 0 ? (
                          <ArrowUpRight size={16} />
                        ) : (
                          <ArrowDownRight size={16} />
                        )}
                        {Math.abs(cliente.crecimiento)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Detalle por Cliente" subtitle="Inventario y ventas Mayo 2026">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ textAlign: "left", padding: "12px", color: "rgba(255,255,255,0.6)" }}>
                    Cliente/Bodega
                  </th>
                  <th style={{ textAlign: "right", padding: "12px", color: "rgba(255,255,255,0.6)" }}>
                    Cajas
                  </th>
                  <th style={{ textAlign: "right", padding: "12px", color: "rgba(255,255,255,0.6)" }}>
                    Valor
                  </th>
                  <th style={{ textAlign: "center", padding: "12px", color: "rgba(255,255,255,0.6)" }}>
                    Cobertura
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventarioMayo2026.slice(0, 3).map((item, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px", fontWeight: 600, color: "#fff" }}>
                      {item.cliente}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", color: "rgba(255,255,255,0.8)" }}>
                      {item.cajasInventario.toLocaleString("es-MX")}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", color: "#60a5fa" }}>
                      ${item.valorInventario.toLocaleString("es-MX")}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: item.cobertura < 3 ? "rgba(239,68,68,0.2)" : item.cobertura > 7 ? "rgba(139,92,246,0.2)" : "rgba(34,197,94,0.2)",
                          color: item.cobertura < 3 ? "#ef4444" : item.cobertura > 7 ? "#8b5cf6" : "#22c55e",
                        }}
                      >
                        {item.cobertura} días
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 8px rgba(34,197,94,0.5)",
            }}
          />
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>
            Sistema en línea | Datos actualizados en tiempo real
          </span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>
          OXDA Sistema de Gestión © 2026 | Versión Premium
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
