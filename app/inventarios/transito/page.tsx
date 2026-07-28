"use client";

import { useState } from "react";
import { BarChartComponent, LineChartComponent, StatCard, ChartCard } from "@/components/charts";
import { Truck, Package, Clock, MapPin, AlertTriangle, CheckCircle, Calendar, Search } from "lucide-react";

// Datos de inventarios en tránsito derivados de llegadas del CSV
const transitoData = [
  { id: "T-001", almacenDestino: "Abastos Logicos", producto: "Papa Recta 3/8", cajas: 2268, valor: 626000, origen: "Proveedor A", eta: "2026-06-03", estado: "En ruta", transportista: "Transportes del Norte" },
  { id: "T-002", almacenDestino: "CDMX", producto: "Papa Delgada 1/4", cajas: 1512, valor: 418000, origen: "Proveedor A", eta: "2026-06-05", estado: "En ruta", transportista: "Logística CDMX" },
  { id: "T-003", almacenDestino: "Bajo Cero", producto: "Papa Castel Straight", cajas: 1312, valor: 362000, origen: "Proveedor B", eta: "2026-06-04", estado: "En ruta", transportista: "Frío Express" },
  { id: "T-004", almacenDestino: "Frjalisco", producto: "Papa Ondulada 1/2", cajas: 593, valor: 164000, origen: "Proveedor C", eta: "2026-06-06", estado: "Pendiente", transportista: "Cargas Jalisco" },
  { id: "T-005", almacenDestino: "Abastos Logicos", producto: "Papa Recta Cobertura", cajas: 2376, valor: 655000, origen: "Proveedor B", eta: "2026-06-08", estado: "Pendiente", transportista: "Transportes del Norte" },
  { id: "T-006", almacenDestino: "CDMX", producto: "Papa Gajo Sazonado", cajas: 1512, valor: 418000, origen: "Proveedor A", eta: "2026-06-07", estado: "En ruta", transportista: "Logística CDMX" },
];

const transitoPorAlmacen = [
  { almacen: "Abastos Logicos", cajas: 4644, valor: 1281000 },
  { almacen: "CDMX", cajas: 3024, valor: 836000 },
  { almacen: "Bajo Cero", cajas: 2622, valor: 724000 },
  { almacen: "Frjalisco", cajas: 1185, valor: 327000 },
];

export default function InventariosTransitoPage() {
  const [filtro, setFiltro] = useState("");

  const transitoFiltrado = filtro
    ? transitoData.filter((t) => t.almacenDestino.toLowerCase().includes(filtro.toLowerCase()) || t.producto.toLowerCase().includes(filtro.toLowerCase()))
    : transitoData;

  const totalCajas = transitoData.reduce((acc, t) => acc + t.cajas, 0);
  const totalValor = transitoData.reduce((acc, t) => acc + t.valor, 0);
  const enRuta = transitoData.filter((t) => t.estado === "En ruta").length;
  const pendientes = transitoData.filter((t) => t.estado === "Pendiente").length;

  return (
    <div style={{ padding: "24px 28px", maxWidth: "1600px", margin: "0 auto" }}>
      <header style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", margin: "0 0 6px 0" }}>
              <Truck size={28} style={{ verticalAlign: "middle", marginRight: "10px" }} />
              Inventarios en Tránsito
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>
              Llegadas programadas y mercancía en ruta
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.3)", padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Search size={16} color="rgba(255,255,255,0.5)" />
              <input
                type="text"
                placeholder="Buscar almacén o producto..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "13px", outline: "none", width: "220px" }}
              />
            </div>
          </div>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <StatCard title="Cajas en Tránsito" value={totalCajas.toLocaleString()} subtitle="Próximas llegadas" trend="6 embarques" trendUp={true} icon={<Package size={20} color="#f59e0b" />} color="orange" />
        <StatCard title="Valor en Tránsito" value={`$${(totalValor / 1000000).toFixed(2)}M`} subtitle="Mercancía en ruta" trend="+18% vs semana ant." trendUp={true} icon={<Truck size={20} color="#60a5fa" />} color="blue" />
        <StatCard title="Embarques en Ruta" value={enRuta.toString()} subtitle="Actualmente transportándose" trend="${pendientes} pendientes" trendUp={true} icon={<Clock size={20} color="#22c55e" />} color="green" />
        <StatCard title="ETA Próximo" value="03 Jun" subtitle="Abastos Logicos" trend="2268 cajas" trendUp={true} icon={<Calendar size={20} color="#8b5cf6" />} color="purple" />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <ChartCard title="Cajas en Tránsito por Destino" subtitle="Próximas llegadas por almacén">
          <BarChartComponent data={transitoPorAlmacen} dataKeys={[{ key: "cajas", name: "Cajas", color: "#f59e0b" }]} xAxisKey="almacen" height={300} />
        </ChartCard>
        <ChartCard title="Valor por Destino" subtitle="$ en tránsito">
          <BarChartComponent data={transitoPorAlmacen} dataKeys={[{ key: "valor", name: "Valor ($)", color: "#00a0e3" }]} xAxisKey="almacen" height={300} />
        </ChartCard>
      </div>

      <ChartCard title="Detalle de Embarques" subtitle="Seguimiento de inventario en tránsito">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "rgba(0,48,135,0.1)" }}>
                <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>ID</th>
                <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Destino</th>
                <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Producto</th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Cajas</th>
                <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Valor Est.</th>
                <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Origen</th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>ETA</th>
                <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Transportista</th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {transitoFiltrado.map((t, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "14px", color: "#60a5fa", fontWeight: 600 }}>{t.id}</td>
                  <td style={{ padding: "14px", color: "#fff" }}>
                    <MapPin size={14} color="#60a5fa" style={{ marginRight: "6px", verticalAlign: "middle" }} />
                    {t.almacenDestino}
                  </td>
                  <td style={{ padding: "14px", color: "rgba(255,255,255,0.8)" }}>{t.producto}</td>
                  <td style={{ padding: "14px", textAlign: "center", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{t.cajas.toLocaleString()}</td>
                  <td style={{ padding: "14px", textAlign: "right", color: "#f59e0b", fontWeight: 600 }}>${t.valor.toLocaleString()}</td>
                  <td style={{ padding: "14px", color: "rgba(255,255,255,0.6)" }}>{t.origen}</td>
                  <td style={{ padding: "14px", textAlign: "center", color: "rgba(255,255,255,0.8)" }}>
                    {new Date(t.eta).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                  </td>
                  <td style={{ padding: "14px", color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>{t.transportista}</td>
                  <td style={{ padding: "14px", textAlign: "center" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                      background: t.estado === "En ruta" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                      color: t.estado === "En ruta" ? "#22c55e" : "#f59e0b",
                    }}>
                      {t.estado === "En ruta" ? <CheckCircle size={11} style={{ marginRight: "4px", verticalAlign: "middle" }} /> : <Clock size={11} style={{ marginRight: "4px", verticalAlign: "middle" }} />}
                      {t.estado}
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
