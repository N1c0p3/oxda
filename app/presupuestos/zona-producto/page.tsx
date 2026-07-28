"use client";

import { useEffect, useState } from "react";
import { BarChartComponent, PieChartComponent, StatCard, ChartCard } from "@/components/charts";
import { MapPin, Target, Package, TrendingUp, Search } from "lucide-react";
import { useZone } from "@/components/zone-filter";

type PresupuestoZona = { zona: string; producto: string; enero: number; febrero: number; marzo: number; abril: number; mayo: number };
type PresupuestoProducto = { producto: string; presupuesto: number; real: number; avance: number };

export default function PresupuestoZonaProductoPage() {
  const { zone } = useZone();
  const [vista, setVista] = useState("zona");
  const [filtro, setFiltro] = useState("");
  const [presupuestoZona, setPresupuestoZona] = useState<PresupuestoZona[]>([]);
  const [presupuestoProducto, setPresupuestoProducto] = useState<PresupuestoProducto[]>([]);

  useEffect(() => {
    fetch("/api/v1/presupuestos")
      .then((res) => res.json())
      .then((data: { zonas?: PresupuestoZona[]; productos?: PresupuestoProducto[] }) => {
        setPresupuestoZona(data.zonas ?? []);
        setPresupuestoProducto(data.productos ?? []);
      })
      .catch(() => {
        setPresupuestoZona([]);
        setPresupuestoProducto([]);
      });
  }, []);

  const zonasZona = zone === "TODAS" ? presupuestoZona : presupuestoZona.filter((item) => item.zona === zone);
  const productKey = (zonasZona[0]?.producto ?? "").toLowerCase().split(" ").slice(0, 2).join(" ");
  const productoZona = zone === "TODAS"
    ? presupuestoProducto
    : presupuestoProducto.filter((item) => item.producto.toLowerCase().includes(productKey));

  const zonasFiltradas = filtro
    ? zonasZona.filter((z) => z.zona.toLowerCase().includes(filtro.toLowerCase()))
    : zonasZona;

  const productosFiltrados = filtro
    ? productoZona.filter((p) => p.producto.toLowerCase().includes(filtro.toLowerCase()))
    : productoZona;

  const totalPresupuesto = zonasZona.reduce((acc, z) => acc + z.mayo, 0);
  const totalAcumulado = zonasZona.reduce((acc, z) => acc + z.enero + z.febrero + z.marzo + z.abril + z.mayo, 0);
  const divisionMayor = zonasZona.length ? zonasZona.reduce((best, item) => item.mayo > best.mayo ? item : best) : null;
  const productoLider = productoZona.length ? productoZona.reduce((best, item) => item.avance > best.avance ? item : best) : null;

  return (
    <div style={{ padding: "24px 28px", maxWidth: "1600px", margin: "0 auto" }}>
      <header style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", margin: "0 0 6px 0" }}>
              <Target size={28} style={{ verticalAlign: "middle", marginRight: "10px" }} />
              Presupuesto por Zona y Producto
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>
              Planificación mensual por división y categoría de producto
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <select
              value={vista}
              onChange={(e) => setVista(e.target.value)}
              style={{ padding: "10px 16px", background: "rgba(0,48,135,0.15)", border: "1px solid rgba(0,48,135,0.3)", borderRadius: "10px", color: "#60a5fa", fontSize: "13px", fontWeight: 600 }}
            >
              <option value="zona">Por Zona</option>
              <option value="producto">Por Producto</option>
            </select>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.3)", padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Search size={16} color="rgba(255,255,255,0.5)" />
              <input
                type="text"
                placeholder="Buscar..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "13px", outline: "none", width: "150px" }}
              />
            </div>
          </div>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <StatCard title="Presupuesto Mayo" value={`$${(totalPresupuesto / 1000000).toFixed(2)}M`} subtitle={zone === "TODAS" ? "Total zonas" : zone} trend={`${zonasZona.length} divisiones`} trendUp={true} icon={<Target size={20} color="#f59e0b" />} color="orange" />
        <StatCard title="Presupuesto Acumulado" value={`$${(totalAcumulado / 1000000).toFixed(2)}M`} subtitle="Ene - May 2026" trend="Enero líder" trendUp={true} icon={<TrendingUp size={20} color="#22c55e" />} color="green" />
        <StatCard title="División Mayor" value={divisionMayor?.zona ?? "Sin presupuesto"} subtitle={divisionMayor ? `$${divisionMayor.mayo.toLocaleString()} mayo` : "Zona sin meta"} trend={divisionMayor ? "Meta configurada" : "Pendiente"} trendUp={Boolean(divisionMayor)} icon={<MapPin size={20} color="#60a5fa" />} color="blue" />
        <StatCard title="Producto Líder" value={productoLider?.producto ?? "Sin producto"} subtitle={productoLider ? `${productoLider.avance}% avance` : "Sin asignación"} trend={productoLider ? `$${productoLider.presupuesto.toLocaleString()} presupuesto` : "Pendiente"} trendUp={Boolean(productoLider)} icon={<Package size={20} color="#8b5cf6" />} color="purple" />
      </section>

      {vista === "zona" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <ChartCard title="Presupuesto Mensual por Zona" subtitle="Enero - Mayo 2026">
              <BarChartComponent
                data={zonasZona}
                dataKeys={[
                  { key: "enero", name: "Enero", color: "#003087" },
                  { key: "febrero", name: "Febrero", color: "#00a0e3" },
                  { key: "marzo", name: "Marzo", color: "#8b5cf6" },
                  { key: "abril", name: "Abril", color: "#f59e0b" },
                  { key: "mayo", name: "Mayo", color: "#22c55e" },
                ]}
                xAxisKey="zona"
                height={320}
              />
            </ChartCard>
            <ChartCard title="Presupuesto Mayo por Zona" subtitle="Distribución">
              <PieChartComponent data={zonasZona} dataKey="mayo" nameKey="zona" height={320} donut={true} />
            </ChartCard>
          </div>

          <ChartCard title="Detalle por Zona" subtitle="Presupuesto mensual y producto principal">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "rgba(0,48,135,0.1)" }}>
                    <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Zona</th>
                    <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Producto Principal</th>
                    <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Enero</th>
                    <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Febrero</th>
                    <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Marzo</th>
                    <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Abril</th>
                    <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Mayo</th>
                    <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {zonasFiltradas.map((z: typeof presupuestoZona[0], idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "14px", fontWeight: 600, color: "#fff" }}>
                        <MapPin size={14} color="#60a5fa" style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        {z.zona}
                      </td>
                      <td style={{ padding: "14px", color: "rgba(255,255,255,0.8)" }}>{z.producto}</td>
                      <td style={{ padding: "14px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>${z.enero.toLocaleString()}</td>
                      <td style={{ padding: "14px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>${z.febrero.toLocaleString()}</td>
                      <td style={{ padding: "14px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>${z.marzo.toLocaleString()}</td>
                      <td style={{ padding: "14px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>${z.abril.toLocaleString()}</td>
                      <td style={{ padding: "14px", textAlign: "right", color: "#22c55e", fontWeight: 600 }}>${z.mayo.toLocaleString()}</td>
                      <td style={{ padding: "14px", textAlign: "right", color: "#60a5fa", fontWeight: 700 }}>${(z.enero + z.febrero + z.marzo + z.abril + z.mayo).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <ChartCard title="Avance por Producto" subtitle="Presupuesto vs Real acumulado">
              <BarChartComponent
                data={productoZona}
                dataKeys={[
                  { key: "presupuesto", name: "Presupuesto", color: "#003087" },
                  { key: "real", name: "Real", color: "#00a0e3" },
                ]}
                xAxisKey="producto"
                height={320}
              />
            </ChartCard>
            <ChartCard title="% Avance" subtitle="Cumplimiento por producto">
              <BarChartComponent data={productoZona} dataKeys={[{ key: "avance", name: "Avance %", color: "#22c55e" }]} xAxisKey="producto" height={320} />
            </ChartCard>
          </div>

          <ChartCard title="Detalle por Producto" subtitle="Presupuesto, real y avance">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "rgba(0,48,135,0.1)" }}>
                    <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Producto</th>
                    <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Presupuesto</th>
                    <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Real</th>
                    <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Avance</th>
                    <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((p: typeof presupuestoProducto[0], idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "14px", fontWeight: 600, color: "#fff" }}>
                        <Package size={14} color="#8b5cf6" style={{ marginRight: "6px", verticalAlign: "middle" }} />
                        {p.producto}
                      </td>
                      <td style={{ padding: "14px", textAlign: "right", color: "rgba(255,255,255,0.8)" }}>${p.presupuesto.toLocaleString()}</td>
                      <td style={{ padding: "14px", textAlign: "right", color: "#60a5fa", fontWeight: 600 }}>${p.real.toLocaleString()}</td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                          <div style={{ width: "60px", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }}>
                            <div style={{ width: `${p.avance}%`, height: "100%", background: p.avance >= 80 ? "#22c55e" : p.avance >= 60 ? "#f59e0b" : "#ef4444", borderRadius: "4px" }} />
                          </div>
                          <span style={{ fontSize: "12px", color: p.avance >= 80 ? "#22c55e" : p.avance >= 60 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>{p.avance}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <span style={{
                          padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                          background: p.avance >= 80 ? "rgba(34,197,94,0.15)" : p.avance >= 60 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                          color: p.avance >= 80 ? "#22c55e" : p.avance >= 60 ? "#f59e0b" : "#ef4444",
                        }}>
                          {p.avance >= 80 ? "ÓPTIMO" : p.avance >= 60 ? "EN PROCESO" : "CRÍTICO"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}
