"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Types ────────────────────────────────────────────────────────────── */
type AreaStat  = { kg: number; merma: number; capturas: number };
type EtapaStat = { count: number; monto: number };

type Stats = {
  produccion: {
    totalKg: number; totalMerma: number; mermaPct: number; totalParos: number;
    eficiencia: number; capturas: number; incidencias: number;
    porArea: Record<string, AreaStat>; porTurno: Record<string, number>;
  };
  inventarios: {
    totalMovimientos: number; entradas: number; salidas: number;
    transferencias: number; ajustes: number; stockEstimado: number;
    movByTipo: Record<string, number>;
  };
  ventas: {
    totalPedidos: number; ventasTotal: number; ventasEntregadas: number;
    ticketPromedio: number; pedidosActivos: number;
    ventasPorEst: Record<string, number>;
  };
  logistica: {
    totalEnvios: number; enviosEntregados: number; enRuta: number;
    programados: number; fillRate: number; enviosByEst: Record<string, number>;
  };
  crm: {
    totalOportunidades: number; pipelineTotal: number; pipelinePonderado: number;
    ganadas: number; perdidas: number; tasaConversion: number;
    crmByEtapa: Record<string, EtapaStat>;
  };
  generatedAt: string;
};

/* ─── Helpers ──────────────────────────────────────────────────────────── */
function fmt(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtM(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${fmt(n)}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

const TURNO_LABEL: Record<string, string> = {
  matutino: "Matutino", vespertino: "Vespertino", nocturno: "Nocturno",
};
const ESTATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente", en_proceso: "En proceso", entregado: "Entregado",
  cancelado: "Cancelado", programado: "Programado", en_ruta: "En ruta",
  enviado: "Enviado", devuelto: "Devuelto",
};
const ETAPA_ORDER = ["prospecto","calificado","propuesta","negociacion","ganado","perdido"];
const ETAPA_COLOR: Record<string, string> = {
  prospecto:   "rgba(148,163,184,0.8)",
  calificado:  "rgba(96,165,250,0.8)",
  propuesta:   "rgba(251,191,36,0.8)",
  negociacion: "rgba(251,146,60,0.8)",
  ganado:      "rgba(74,222,128,0.9)",
  perdido:     "rgba(248,113,113,0.8)",
};

/* Mini bar */
function Bar({ pct, color, height = 8 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height, background: "rgba(255,255,255,0.07)", borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${Math.min(100, pct)}%`,
        background: color, borderRadius: height / 2,
        transition: "width .7s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

/* KPI mini card */
function Kpi({
  label, value, sub, color = "var(--text)", accent,
}: { label: string; value: string; sub?: string; color?: string; accent?: string }) {
  return (
    <div className="kpi-card" style={{ minWidth: 0 }}>
      {accent && (
        <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: accent, opacity: .08, pointerEvents: "none" }} />
      )}
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color, fontSize: "1.55rem" }}>{value}</div>
      {sub && <div className="kpi-unit">{sub}</div>}
    </div>
  );
}

/* Section header */
function SecHeader({ icon, title, color }: { icon: string; title: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".7rem", marginBottom: ".9rem", paddingBottom: ".6rem", borderBottom: `2px solid ${color}22` }}>
      <span style={{ fontSize: "1.3rem", filter: "drop-shadow(0 0 6px currentColor)" }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color, letterSpacing: ".01em" }}>{title}</h2>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
export default function EstadisticasPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/estadisticas");
      setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading && !stats) return (
    <>
      <div className="topbar">
        <span className="topbar-title">📈 Estadísticas</span>
      </div>
      <div className="page">
        <div className="kpi-grid">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="kpi-card" style={{ height: 90, animation: "shimmer-pulse 1.4s ease infinite", animationDelay: `${i * .12}s` }} />
          ))}
        </div>
      </div>
    </>
  );

  if (!stats) return null;

  const { produccion: P, inventarios: I, ventas: V, logistica: L, crm: C } = stats;

  /* Area bars */
  const maxAreaKg = Math.max(...Object.values(P.porArea).map((a) => a.kg), 1);
  const maxTurnoKg = Math.max(...Object.values(P.porTurno), 1);

  /* Etapas CRM */
  const etapas = ETAPA_ORDER.filter((e) => C.crmByEtapa[e]);
  const maxEtapaMonto = Math.max(...etapas.map((e) => C.crmByEtapa[e]?.monto ?? 0), 1);

  /* Ventas estatus */
  const estVentas = Object.entries(V.ventasPorEst).sort((a, b) => b[1] - a[1]);
  const maxEstV   = Math.max(...Object.values(V.ventasPorEst), 1);

  /* Envíos estatus */
  const estLogistica = Object.entries(L.enviosByEst).sort((a, b) => b[1] - a[1]);
  const maxEstL      = Math.max(...Object.values(L.enviosByEst), 1);

  /* Inventario tipos */
  const movEntries = Object.entries(I.movByTipo).sort((a, b) => b[1] - a[1]);
  const maxMov     = Math.max(...Object.values(I.movByTipo), 1);

  const fillRateColor = L.fillRate >= 80 ? "var(--accent)" : L.fillRate >= 50 ? "var(--accent2)" : "var(--danger)";

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">📈 Estadísticas y Seguimiento</span>
        <span className="topbar-badge">Tiempo real</span>
        <button
          className="btn btn-ghost"
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: ".4rem" }}
          onClick={fetchStats}
          disabled={loading}
        >
          <span style={{ display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>🔄</span>
          {loading ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      <div className="page">
        <div className="page-header">
          <h1 className="page-title gradient-text">Panel de seguimiento operativo</h1>
          <p className="page-subtitle">
            Vista consolidada de todos los módulos del sistema — {fmtDate(stats.generatedAt)}
          </p>
        </div>

        {/* ─── RESUMEN GLOBAL ─────────────────────────────────────────────────── */}
        <div className="kpi-grid" style={{ marginBottom: "1.6rem" }}>
          <Kpi label="Kg procesados (total)"    value={`${fmt(P.totalKg)} kg`}     sub={`${P.capturas} capturas`}   color="var(--accent)"  accent="var(--accent)" />
          <Kpi label="Ventas totales"            value={fmtM(V.ventasTotal)}         sub={`${V.totalPedidos} pedidos`} color="var(--accent)"  accent="var(--accent)" />
          <Kpi label="Pipeline CRM"              value={fmtM(C.pipelineTotal)}       sub={`${C.totalOportunidades} oport.`} color="rgba(96,165,250,1)" accent="rgba(96,165,250,1)" />
          <Kpi label="Fill rate logística"       value={`${L.fillRate}%`}           sub={`${L.enviosEntregados}/${L.totalEnvios} envíos`} color={fillRateColor} />
          <Kpi label="Conversión CRM"            value={`${C.tasaConversion}%`}     sub={`${C.ganadas} ganadas / ${C.perdidas} perdidas`} color={C.tasaConversion >= 60 ? "var(--accent)" : "var(--accent2)"} />
        </div>

        {/* ─── PRODUCCIÓN ──────────────────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: "1rem" }}>
          <SecHeader icon="🏭" title="Producción" color="var(--accent)" />

          <div className="kpi-grid" style={{ marginBottom: "1.2rem" }}>
            <Kpi label="Kg procesados"  value={`${fmt(P.totalKg)} kg`}  color="var(--accent)" />
            <Kpi label="Merma total"    value={`${fmt(P.totalMerma)} kg`} sub={`${P.mermaPct}% del total`} color={P.mermaPct > 8 ? "var(--danger)" : "var(--accent2)"} />
            <Kpi label="Eficiencia"     value={`${P.eficiencia}%`}       color={P.eficiencia >= 90 ? "var(--accent)" : "var(--accent2)"} />
            <Kpi label="Min. de paro"   value={`${P.totalParos} min`}    sub={`${P.incidencias} incidencias`} color={P.totalParos > 60 ? "var(--danger)" : "var(--text)"} />
          </div>

          <div className="two-col">
            {/* Por área */}
            <div>
              <p style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".65rem" }}>Kg por área</p>
              <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                {Object.entries(P.porArea).sort((a, b) => b[1].kg - a[1].kg).map(([area, d]) => (
                  <div key={area}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".22rem" }}>
                      <span style={{ fontSize: ".82rem", color: "var(--text-muted)" }}>{area}</span>
                      <span style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--text)" }}>{fmt(d.kg)} kg</span>
                    </div>
                    <Bar pct={(d.kg / maxAreaKg) * 100} color="linear-gradient(90deg,rgba(74,222,128,.85),rgba(163,230,53,.55))" />
                    <div style={{ fontSize: ".68rem", color: "var(--text-muted)", marginTop: ".15rem" }}>
                      Merma: {fmt(d.merma)} kg ({d.kg > 0 ? ((d.merma / d.kg) * 100).toFixed(1) : 0}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Por turno */}
            <div>
              <p style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".65rem" }}>Kg por turno</p>
              <div style={{ display: "flex", flexDirection: "column", gap: ".65rem" }}>
                {Object.entries(P.porTurno).sort((a, b) => b[1] - a[1]).map(([turno, kg]) => (
                  <div key={turno}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".22rem" }}>
                      <span style={{ fontSize: ".82rem", color: "var(--text-muted)" }}>{TURNO_LABEL[turno] ?? turno}</span>
                      <span style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--text)" }}>{fmt(kg)} kg</span>
                    </div>
                    <Bar pct={(kg / maxTurnoKg) * 100} color="linear-gradient(90deg,rgba(74,222,128,.7),rgba(16,185,129,.5))" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── VENTAS + LOGÍSTICA ──────────────────────────────────────────────── */}
        <div className="two-col" style={{ marginBottom: "1rem" }}>

          {/* VENTAS */}
          <div className="card">
            <SecHeader icon="🛒" title="Pedidos y Ventas" color="var(--accent2)" />

            <div className="kpi-grid" style={{ marginBottom: "1.1rem", gridTemplateColumns: "1fr 1fr" }}>
              <Kpi label="Ventas totales"    value={fmtM(V.ventasTotal)}       color="var(--accent)"  />
              <Kpi label="Ya entregadas"     value={fmtM(V.ventasEntregadas)}  color="var(--accent)"  />
              <Kpi label="Ticket promedio"   value={fmtM(V.ticketPromedio)}    color="var(--accent2)" />
              <Kpi label="Pedidos activos"   value={String(V.pedidosActivos)}  sub="en proceso/pendientes" color={V.pedidosActivos > 0 ? "var(--accent2)" : "var(--text-muted)"} />
            </div>

            <p style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".65rem" }}>Por estatus</p>
            <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
              {estVentas.map(([est, cnt]) => (
                <div key={est}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".2rem" }}>
                    <span style={{ fontSize: ".8rem", color: "var(--text-muted)" }}>{ESTATUS_LABEL[est] ?? est}</span>
                    <span style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--text)" }}>{cnt} pedido{cnt > 1 ? "s" : ""}</span>
                  </div>
                  <Bar pct={(cnt / maxEstV) * 100}
                    color={est === "entregado" ? "rgba(74,222,128,.75)" : est === "en_proceso" ? "rgba(251,191,36,.75)" : est === "cancelado" ? "rgba(248,113,113,.75)" : "rgba(148,163,184,.6)"} />
                </div>
              ))}
            </div>
          </div>

          {/* LOGÍSTICA */}
          <div className="card">
            <SecHeader icon="🚛" title="Logística" color="rgba(96,165,250,1)" />

            <div className="kpi-grid" style={{ marginBottom: "1.1rem", gridTemplateColumns: "1fr 1fr" }}>
              <Kpi label="Fill rate"        value={`${L.fillRate}%`}           color={fillRateColor} />
              <Kpi label="Entregados"       value={String(L.enviosEntregados)} sub={`de ${L.totalEnvios} envíos`} color="var(--accent)" />
              <Kpi label="En ruta ahora"    value={String(L.enRuta)}           color="rgba(96,165,250,1)" />
              <Kpi label="Programados"      value={String(L.programados)}      color="var(--accent2)" />
            </div>

            <p style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".65rem" }}>Por estatus</p>
            <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
              {estLogistica.map(([est, cnt]) => (
                <div key={est}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".2rem" }}>
                    <span style={{ fontSize: ".8rem", color: "var(--text-muted)" }}>{ESTATUS_LABEL[est] ?? est}</span>
                    <span style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--text)" }}>{cnt}</span>
                  </div>
                  <Bar pct={(cnt / maxEstL) * 100}
                    color={est === "entregado" ? "rgba(74,222,128,.75)" : est === "en_ruta" ? "rgba(96,165,250,.8)" : est === "devuelto" ? "rgba(248,113,113,.75)" : "rgba(251,191,36,.7)"} />
                </div>
              ))}
            </div>

            {/* Fill rate visual ring */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1.1rem", padding: ".8rem 1rem", background: "rgba(96,165,250,0.06)", borderRadius: 12, border: "1px solid rgba(96,165,250,0.15)" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                background: `conic-gradient(${fillRateColor} ${L.fillRate * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 14px ${fillRateColor}44`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 800, color: fillRateColor }}>{L.fillRate}%</div>
              </div>
              <div>
                <div style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--text)" }}>Fill Rate de envíos</div>
                <div style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>{L.enviosEntregados} de {L.totalEnvios} pedidos entregados correctamente</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CRM ─────────────────────────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: "1rem" }}>
          <SecHeader icon="🤝" title="CRM — Pipeline comercial" color="rgba(167,139,250,1)" />

          <div className="kpi-grid" style={{ marginBottom: "1.2rem" }}>
            <Kpi label="Pipeline total"    value={fmtM(C.pipelineTotal)}        color="rgba(167,139,250,1)" />
            <Kpi label="Pipeline ponderado"value={fmtM(C.pipelinePonderado)}    sub="ajustado por probabilidad" color="rgba(167,139,250,.8)" />
            <Kpi label="Tasa de conversión"value={`${C.tasaConversion}%`}       sub={`${C.ganadas} ganadas`}  color={C.tasaConversion >= 60 ? "var(--accent)" : "var(--accent2)"} />
            <Kpi label="Oportunidades"     value={String(C.totalOportunidades)} sub={`${C.perdidas} perdidas`} color="var(--text)" />
          </div>

          {/* Funnel por etapa */}
          <p style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".8rem" }}>Funnel por etapa</p>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            {etapas.map((etapa) => {
              const d = C.crmByEtapa[etapa];
              if (!d) return null;
              const pct = Math.round((d.monto / maxEtapaMonto) * 100);
              return (
                <div key={etapa} style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                    background: ETAPA_COLOR[etapa], boxShadow: `0 0 6px ${ETAPA_COLOR[etapa]}`,
                  }} />
                  <span style={{ fontSize: ".82rem", color: "var(--text-muted)", width: 100, flexShrink: 0, textTransform: "capitalize" }}>{etapa}</span>
                  <div style={{ flex: 1 }}>
                    <Bar pct={pct} color={ETAPA_COLOR[etapa]} height={10} />
                  </div>
                  <span style={{ fontSize: ".78rem", color: "var(--text-muted)", width: 28, textAlign: "right", flexShrink: 0 }}>{d.count}</span>
                  <span style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--text)", width: 70, textAlign: "right", flexShrink: 0 }}>{fmtM(d.monto)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── INVENTARIOS ────────────────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: "1rem" }}>
          <SecHeader icon="📦" title="Inventarios" color="var(--accent2)" />

          <div className="kpi-grid" style={{ marginBottom: "1.2rem" }}>
            <Kpi label="Entradas"           value={`${fmt(I.entradas)} u`}     color="var(--accent)" />
            <Kpi label="Salidas"            value={`${fmt(I.salidas)} u`}      color="var(--danger)" />
            <Kpi label="Transferencias"     value={`${fmt(I.transferencias)} u`} color="rgba(96,165,250,1)" />
            <Kpi label="Stock estimado"     value={`${fmt(I.stockEstimado)} u`} sub="entradas − salidas − ajustes" color={I.stockEstimado >= 0 ? "var(--accent)" : "var(--danger)"} />
          </div>

          <p style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".65rem" }}>Movimientos por tipo</p>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            {movEntries.map(([tipo, cnt]) => {
              const colors: Record<string, string> = {
                entrada: "rgba(74,222,128,.8)", salida: "rgba(248,113,113,.8)",
                transferencia: "rgba(96,165,250,.8)", ajuste: "rgba(251,191,36,.8)",
              };
              return (
                <div key={tipo}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".2rem" }}>
                    <span style={{ fontSize: ".8rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{tipo}</span>
                    <span style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--text)" }}>{fmt(cnt)} u</span>
                  </div>
                  <Bar pct={(cnt / maxMov) * 100} color={colors[tipo] ?? "rgba(148,163,184,.6)"} />
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer-pulse { 0%,100%{opacity:.5} 50%{opacity:.9} }
      `}</style>
    </>
  );
}
