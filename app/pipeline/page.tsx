"use client";

import { useState } from "react";
import {
  BarChartComponent,
  PieChartComponent,
  StatCard,
  ChartCard,
} from "@/components/charts";
import {
  Funnel,
  Users,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Target,
  TrendingUp,
  AlertCircle,
  Calendar,
  Building2,
  User,
  Mail,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// DATOS PIPELINE - Basado en estructura de prospectos/clientes potenciales
// ═══════════════════════════════════════════════════════════════════════════

// Etapas del pipeline
const etapasPipeline = [
  { id: "prospeccion", nombre: "Prospección", color: "#64748b", icon: "🔍", cantidad: 24, valor: 2845000 },
  { id: "contacto", nombre: "Primer Contacto", color: "#3b82f6", icon: "📞", cantidad: 18, valor: 1956000 },
  { id: "propuesta", nombre: "Propuesta Enviada", color: "#8b5cf6", icon: "📄", cantidad: 12, valor: 1420000 },
  { id: "negociacion", nombre: "Negociación", color: "#f59e0b", icon: "🤝", cantidad: 8, valor: 980000 },
  { id: "cerrado", nombre: "Cerrado Ganado", color: "#22c55e", icon: "✅", cantidad: 6, valor: 621000 },
  { id: "perdido", nombre: "Cerrado Perdido", color: "#ef4444", icon: "❌", cantidad: 4, valor: 0 },
];

// Leads/Prospectos
const leadsData = [
  { id: 1, empresa: "CREMERIA LOS ALTOS", contacto: "Juan Pérez", telefono: "33-1234-5678", email: "juan@cremeria.com", etapa: "negociacion", valor: 250000, probabilidad: 75, ultimoContacto: "2026-06-03", vendedor: "Mario", origen: "Referido", actividad: "Esperando confirmación de pedido" },
  { id: 2, empresa: "TREFOODS", contacto: "Ana Torres", telefono: "33-8765-4321", email: "ana@trefoods.com", etapa: "propuesta", valor: 180000, probabilidad: 60, ultimoContacto: "2026-06-02", vendedor: "Gabriela", origen: "Web", actividad: "Enviar cotización actualizada" },
  { id: 3, empresa: "OPERADORA VALIENTE", contacto: "Luis Gómez", telefono: "33-5555-9999", email: "luis@valiente.com", etapa: "cerrado", valor: 111000, probabilidad: 100, ultimoContacto: "2026-05-28", vendedor: "Mario", origen: "Llamada", actividad: "Entrega programada 15/06" },
  { id: 4, empresa: "EL SAZON 86", contacto: "Pedro Martínez", telefono: "33-7777-1111", email: "pedro@sazon86.com", etapa: "contacto", valor: 85000, probabilidad: 40, ultimoContacto: "2026-06-01", vendedor: "Diego", origen: "Evento", actividad: "Agendar demostración" },
  { id: 5, empresa: "COMERCIAL PDC", contacto: "Sofia Ruiz", telefono: "33-2222-8888", email: "sofia@pdc.com", etapa: "prospeccion", valor: 45000, probabilidad: 25, ultimoContacto: "2026-05-30", vendedor: "Gamaliel", origen: "Base", actividad: "Llamada de seguimiento" },
  { id: 6, empresa: "SLOVENSKO", contacto: "Marco Silva", telefono: "33-9999-3333", email: "marco@slovensko.com", etapa: "propuesta", valor: 40000, probabilidad: 55, ultimoContacto: "2026-06-04", vendedor: "Adolfo", origen: "Referido", actividad: "Negociar condiciones de pago" },
  { id: 7, empresa: "ALITAS EL LOCO", contacto: "Carmen Vega", telefono: "33-4444-6666", email: "carmen@alitas.com", etapa: "contacto", valor: 28000, probabilidad: 35, ultimoContacto: "2026-05-29", vendedor: "Karim", origen: "Web", actividad: "Enviar muestras" },
  { id: 8, empresa: "DISTRIBUIDORA BAHIA", contacto: "Roberto Diaz", telefono: "33-6666-2222", email: "roberto@bahia.com", etapa: "perdido", valor: 0, probabilidad: 0, ultimoContacto: "2026-05-15", vendedor: "Mario", origen: "Referido", actividad: "Precio no competitivo" },
];

// Métricas del pipeline
const metricasPipeline = {
  totalLeads: 72,
  activos: 62,
  conversionRate: 8.3,
  promedioCiclo: 18,
  valorPipeline: 7731000,
  valorWeighted: 4252050,
  nuevosEsteMes: 12,
  actividadesPendientes: 24,
};

// Actividades próximas
const actividadesProximas = [
  { id: 1, tipo: "llamada", titulo: "Seguimiento TREFOODS", fecha: "2026-06-06", hora: "10:00", vendedor: "Gabriela", prioridad: "alta" },
  { id: 2, tipo: "reunion", titulo: "Demo EL SAZON 86", fecha: "2026-06-07", hora: "14:30", vendedor: "Diego", prioridad: "media" },
  { id: 3, tipo: "email", titulo: "Cotización SLOVENSKO", fecha: "2026-06-06", hora: "09:00", vendedor: "Adolfo", prioridad: "alta" },
  { id: 4, tipo: "llamada", titulo: "Nuevo lead COMERCIAL PDC", fecha: "2026-06-08", hora: "11:00", vendedor: "Gamaliel", prioridad: "baja" },
  { id: 5, tipo: "visita", titulo: "Entrega OPERADORA VALIENTE", fecha: "2026-06-15", hora: "08:00", vendedor: "Mario", prioridad: "alta" },
];

// Origen de leads
const origenLeads = [
  { origen: "Referidos", cantidad: 28, porcentaje: 38.9 },
  { origen: "Web", cantidad: 18, porcentaje: 25.0 },
  { origen: "Llamadas", cantidad: 15, porcentaje: 20.8 },
  { origen: "Eventos", cantidad: 8, porcentaje: 11.1 },
  { origen: "Base", cantidad: 3, porcentaje: 4.2 },
];

export default function PipelinePage() {
  const [etapaSeleccionada, setEtapaSeleccionada] = useState<string | null>(null);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  const leadsFiltrados = etapaSeleccionada
    ? leadsData.filter((l) => l.etapa === etapaSeleccionada)
    : leadsData;

  const leadsBuscados = filtroBusqueda
    ? leadsFiltrados.filter((l) =>
        l.empresa.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
        l.contacto.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
        l.vendedor.toLowerCase().includes(filtroBusqueda.toLowerCase())
      )
    : leadsFiltrados;

  const getEtapaBadge = (etapa: string) => {
    const etapaInfo = etapasPipeline.find((e) => e.id === etapa);
    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 700,
          background: `${etapaInfo?.color}20`,
          color: etapaInfo?.color,
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {etapaInfo?.icon} {etapaInfo?.nombre}
      </span>
    );
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", margin: "0 0 6px 0" }}>
              Pipeline de Ventas & Prospección
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>
              Gestión de leads, oportunidades y seguimiento comercial
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              style={{
                padding: "10px 16px",
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: "10px",
                color: "#22c55e",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Plus size={16} /> Nuevo Lead
            </button>
            <button
              style={{
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
              }}
            >
              <Filter size={16} /> Filtrar
            </button>
          </div>
        </div>
      </header>

      {/* KPIs Pipeline */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <StatCard
          title="Total Leads"
          value={metricasPipeline.totalLeads.toString()}
          subtitle={`${metricasPipeline.nuevosEsteMes} nuevos este mes`}
          trend="En pipeline"
          trendUp={true}
          icon={<Users size={20} color="#60a5fa" />}
          color="blue"
        />
        <StatCard
          title="Valor Pipeline"
          value={`$${(metricasPipeline.valorPipeline / 1000000).toFixed(2)}M`}
          subtitle={`Weighted: $${(metricasPipeline.valorWeighted / 1000000).toFixed(2)}M`}
          trend="55% probabilidad"
          trendUp={true}
          icon={<Funnel size={20} color="#8b5cf6" />}
          color="purple"
        />
        <StatCard
          title="Tasa Conversión"
          value={`${metricasPipeline.conversionRate}%`}
          subtitle="De prospección a cierre"
          trend="+1.2% vs mes ant."
          trendUp={true}
          icon={<Target size={20} color="#22c55e" />}
          color="green"
        />
        <StatCard
          title="Ciclo Promedio"
          value={`${metricasPipeline.promedioCiclo} días`}
          subtitle="Desde primer contacto"
          trend="-2 días optimizado"
          trendUp={true}
          icon={<Clock size={20} color="#f59e0b" />}
          color="orange"
        />
        <StatCard
          title="Actividades"
          value={metricasPipeline.actividadesPendientes.toString()}
          subtitle="Pendientes esta semana"
          trend="5 para hoy"
          trendUp={false}
          icon={<AlertCircle size={20} color="#ef4444" />}
          color="red"
        />
      </section>

      {/* Visualización del Pipeline (Funnel) */}
      <section style={{ marginBottom: "24px" }}>
        <div
          style={{
            background: "rgba(0,0,0,0.2)",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "24px",
          }}
        >
          <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 20px 0", fontWeight: 600 }}>
            <Funnel size={18} style={{ verticalAlign: "middle", marginRight: "8px" }} />
            Embudo de Ventas
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
            {etapasPipeline.map((etapa, idx) => {
              const porcentaje = idx === 0 ? 100 : (etapa.cantidad / etapasPipeline[0].cantidad) * 100;
              return (
                <div
                  key={etapa.id}
                  onClick={() => setEtapaSeleccionada(etapa.id === etapaSeleccionada ? null : etapa.id)}
                  style={{
                    background:
                      etapa.id === etapaSeleccionada
                        ? `${etapa.color}40`
                        : "rgba(0,0,0,0.3)",
                    border: `2px solid ${etapa.id === etapaSeleccionada ? etapa.color : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "10px",
                    padding: "16px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: `${etapa.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px",
                      fontSize: "20px",
                    }}
                  >
                    {etapa.icon}
                  </div>
                  <p style={{ color: "#fff", fontWeight: 600, fontSize: "13px", margin: "0 0 4px 0" }}>
                    {etapa.nombre}
                  </p>
                  <p style={{ color: etapa.color, fontSize: "22px", fontWeight: 700, margin: "0 0 4px 0" }}>
                    {etapa.cantidad}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: 0 }}>
                    ${(etapa.valor / 1000).toFixed(0)}K
                  </p>
                  {idx > 0 && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "2px 6px",
                        background: "rgba(0,0,0,0.3)",
                        borderRadius: "4px",
                        fontSize: "10px",
                        color: porcentaje >= 50 ? "#22c55e" : "#f59e0b",
                      }}
                    >
                      {porcentaje.toFixed(0)}% conversión
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gráficas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <ChartCard title="Origen de Leads" subtitle="Fuentes de prospección">
          <PieChartComponent data={origenLeads} dataKey="cantidad" nameKey="origen" height={280} donut={true} />
        </ChartCard>

        <ChartCard title="Actividades Próximas" subtitle="Próximos 7 días">
          <div style={{ maxHeight: "280px", overflow: "auto" }}>
            {actividadesProximas.map((act) => (
              <div
                key={act.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background:
                      act.tipo === "llamada"
                        ? "rgba(59,130,246,0.2)"
                        : act.tipo === "reunion"
                        ? "rgba(139,92,246,0.2)"
                        : act.tipo === "visita"
                        ? "rgba(34,197,94,0.2)"
                        : "rgba(245,158,11,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {act.tipo === "llamada" ? (
                    <Phone size={14} color="#3b82f6" />
                  ) : act.tipo === "reunion" ? (
                    <Users size={14} color="#8b5cf6" />
                  ) : act.tipo === "visita" ? (
                    <Building2 size={14} color="#22c55e" />
                  ) : (
                    <Mail size={14} color="#f59e0b" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#fff", fontWeight: 500, fontSize: "13px", margin: "0 0 2px 0" }}>
                    {act.titulo}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: 0 }}>
                    {act.vendedor} • {act.fecha} {act.hora}
                  </p>
                </div>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 600,
                    background:
                      act.prioridad === "alta"
                        ? "rgba(239,68,68,0.15)"
                        : act.prioridad === "media"
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(100,116,139,0.15)",
                    color:
                      act.prioridad === "alta" ? "#ef4444" : act.prioridad === "media" ? "#f59e0b" : "#64748b",
                  }}
                >
                  {act.prioridad.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Tabla de Leads */}
      <div
        style={{
          background: "rgba(0,0,0,0.2)",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h3 style={{ color: "#fff", fontSize: "16px", margin: 0, fontWeight: 600 }}>
              <Building2 size={18} style={{ verticalAlign: "middle", marginRight: "8px" }} />
              Leads y Oportunidades
            </h3>
            {etapaSeleccionada && (
              <button
                onClick={() => setEtapaSeleccionada(null)}
                style={{
                  padding: "4px 10px",
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "6px",
                  color: "#ef4444",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                Limpiar filtro ✕
              </button>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0,0,0,0.3)",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Search size={16} color="rgba(255,255,255,0.5)" />
            <input
              type="text"
              placeholder="Buscar empresa, contacto o vendedor..."
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
                width: "280px",
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "rgba(0,48,135,0.1)" }}>
                <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  Empresa
                </th>
                <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  Contacto
                </th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  Etapa
                </th>
                <th style={{ textAlign: "right", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  Valor Est.
                </th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  Prob.
                </th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  Último Contacto
                </th>
                <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  Vendedor
                </th>
                <th style={{ textAlign: "left", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  Siguiente Acción
                </th>
                <th style={{ textAlign: "center", padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                  Origen
                </th>
              </tr>
            </thead>
            <tbody>
              {leadsBuscados.map((lead) => (
                <tr
                  key={lead.id}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,48,135,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px", fontWeight: 600, color: "#fff" }}>{lead.empresa}</td>
                  <td style={{ padding: "14px", color: "rgba(255,255,255,0.8)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <User size={14} color="#60a5fa" />
                      {lead.contacto}
                    </div>
                  </td>
                  <td style={{ padding: "14px", textAlign: "center" }}>{getEtapaBadge(lead.etapa)}</td>
                  <td style={{ padding: "14px", textAlign: "right", color: "#60a5fa", fontWeight: 600 }}>
                    {lead.valor > 0 ? `$${lead.valor.toLocaleString()}` : "-"}
                  </td>
                  <td style={{ padding: "14px", textAlign: "center" }}>
                    {lead.probabilidad > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "6px",
                            background: "rgba(255,255,255,0.1)",
                            borderRadius: "3px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${lead.probabilidad}%`,
                              height: "100%",
                              background:
                                lead.probabilidad >= 70
                                  ? "#22c55e"
                                  : lead.probabilidad >= 40
                                  ? "#f59e0b"
                                  : "#ef4444",
                              borderRadius: "3px",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", minWidth: "28px" }}>
                          {lead.probabilidad}%
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: "14px", textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
                    {new Date(lead.ultimoContacto).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td style={{ padding: "14px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        background: "rgba(0,160,227,0.15)",
                        borderRadius: "6px",
                        fontSize: "11px",
                        color: "#60a5fa",
                        fontWeight: 500,
                      }}
                    >
                      {lead.vendedor}
                    </span>
                  </td>
                  <td style={{ padding: "14px", color: "rgba(255,255,255,0.7)", fontSize: "11px" }}>
                    {lead.actividad}
                  </td>
                  <td style={{ padding: "14px", textAlign: "center" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "4px",
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      {lead.origen}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leadsBuscados.length === 0 && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <Search size={32} style={{ marginBottom: "10px", opacity: 0.5 }} />
            <p>No se encontraron leads con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        style={{
          marginTop: "32px",
          padding: "20px 24px",
          background: "rgba(0,48,135,0.08)",
          borderRadius: "12px",
          border: "1px solid rgba(0,48,135,0.2)",
          textAlign: "center",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>
          🎯 Pipeline de Ventas OXDA • Gestión de leads y oportunidades • {new Date().toLocaleDateString("es-MX")}
        </p>
      </footer>
    </div>
  );
}
