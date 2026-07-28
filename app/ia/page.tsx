"use client";

import { useState, useEffect, useCallback } from "react";

type SheetRow = Record<string, string>;

type SheetData = {
  ingresos: SheetRow[];
  egresos: SheetRow[];
  source: "sheets" | "mock";
  error: string | null;
  fetchedAt: string;
};

type MonthData = {
  key: string;
  label: string;
  ingresos: number;
  egresos: number;
  balance: number;
};

const MES_LABELS: Record<string, string> = {
  "1": "Ene", "2": "Feb", "3": "Mar", "4": "Abr",
  "5": "May", "6": "Jun", "7": "Jul", "8": "Ago",
  "9": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

function sumImportes(rows: SheetRow[]): number {
  return rows.reduce((acc, r) => acc + (parseFloat(r["Importe"] ?? "0") || 0), 0);
}

function groupByMonth(rows: SheetRow[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    const key = `${row["Año"] ?? "2025"}-${String(row["Mes"] ?? "1").padStart(2, "0")}`;
    result[key] = (result[key] ?? 0) + (parseFloat(row["Importe"] ?? "0") || 0);
  }
  return result;
}

function topCategories(rows: SheetRow[], n = 5): { label: string; total: number; pct: number }[] {
  const cats: Record<string, number> = {};
  for (const row of rows) {
    const cat = row["Tipo de gasto"] || "Sin categoría";
    cats[cat] = (cats[cat] ?? 0) + (parseFloat(row["Importe"] ?? "0") || 0);
  }
  const total = Object.values(cats).reduce((a, v) => a + v, 0);
  return Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, t]) => ({ label, total: t, pct: total ? Math.round((t / total) * 100) : 0 }));
}

function fmt(n: number): string {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

export default function IaPage() {
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ingresos" | "egresos">("ingresos");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/sheets");
      const json: SheetData = await res.json();
      setData(json);
    } catch {
      /* keep previous data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ---- Derived metrics ---- */
  const totalIngresos = data ? sumImportes(data.ingresos) : 0;
  const totalEgresos  = data ? sumImportes(data.egresos) : 0;
  const balance       = totalIngresos - totalEgresos;
  const margen        = totalIngresos ? Math.round((balance / totalIngresos) * 100) : 0;

  /* Monthly chart */
  const ingByMonth = data ? groupByMonth(data.ingresos) : {};
  const egrByMonth = data ? groupByMonth(data.egresos) : {};
  const allKeys = Array.from(new Set([...Object.keys(ingByMonth), ...Object.keys(egrByMonth)])).sort();
  const monthly: MonthData[] = allKeys.map((key) => {
    const [year, month] = key.split("-");
    return {
      key,
      label: `${MES_LABELS[String(parseInt(month))] ?? month} ${String(year).slice(2)}`,
      ingresos: ingByMonth[key] ?? 0,
      egresos:  egrByMonth[key] ?? 0,
      balance:  (ingByMonth[key] ?? 0) - (egrByMonth[key] ?? 0),
    };
  });
  const maxMonthly = Math.max(...monthly.flatMap((m) => [m.ingresos, m.egresos]), 1);

  /* Top categories */
  const topEgresos  = data ? topCategories(data.egresos,  6) : [];
  const topIngresos = data ? topCategories(data.ingresos, 6) : [];

  /* Insights */
  const bestMonth  = monthly.reduce((best, m) => m.ingresos > (best?.ingresos ?? 0) ? m : best, monthly[0]);
  const negMonths  = monthly.filter((m) => m.balance < 0);
  const lastTwo    = monthly.slice(-2);
  const trending   = lastTwo.length === 2 ? lastTwo[1].ingresos > lastTwo[0].ingresos ? "alza" : "baja" : null;
  const topExpCat  = topEgresos[0];

  const insights = [
    bestMonth  && { icon: "🏆", color: "var(--accent)",  text: `Mejor mes: ${bestMonth.label} con $${fmt(bestMonth.ingresos)} de ingresos` },
    negMonths.length && { icon: "⚠️", color: "var(--danger)", text: `${negMonths.length} mes${negMonths.length > 1 ? "es" : ""} con balance negativo detectado${negMonths.length > 0 ? ` (${negMonths.map(m=>m.label).join(", ")})` : ""}` },
    trending && { icon: trending === "alza" ? "📈" : "📉", color: trending === "alza" ? "var(--accent)" : "var(--danger)", text: `Tendencia de ingresos: ${trending === "alza" ? "en ascenso" : "en descenso"}` },
    topExpCat  && { icon: "💡", color: "var(--accent2)", text: `Mayor gasto: "${topExpCat.label}" (${topExpCat.pct}% del total de egresos)` },
    margen > 30 && { icon: "✅", color: "var(--accent)",  text: `Margen saludable del ${margen}%. Flujo positivo sostenido` },
    margen < 0  && { icon: "🚨", color: "var(--danger)",  text: `Margen negativo (${margen}%). Los egresos superan a los ingresos totales` },
  ].filter(Boolean) as { icon: string; color: string; text: string }[];

  const rows = activeTab === "ingresos" ? (data?.ingresos ?? []) : (data?.egresos ?? []);

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">🧠 IA e Integraciones</span>
        <span className="topbar-badge">Google Sheets</span>

        <button
          className="btn btn-ghost"
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: ".4rem" }}
          onClick={fetchData}
          disabled={loading}
        >
          <span style={{ display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>🔄</span>
          {loading ? "Actualizando…" : "Actualizar hoja"}
        </button>
      </div>

      <div className="page">
        <div className="page-header">
          <h1 className="page-title gradient-text">Análisis financiero inteligente</h1>
          <p className="page-subtitle">
            Datos sincronizados directamente desde Google Sheets con análisis automático
          </p>
        </div>

        {/* Connection status */}
        <div style={{ display: "flex", gap: ".6rem", marginBottom: "1.1rem", flexWrap: "wrap", alignItems: "center" }}>
          <span className={`badge ${data?.source === "sheets" ? "badge-green" : "badge-orange"}`}>
            {data?.source === "sheets" ? "🟢 Conectado a Sheets" : "🟡 Datos de demostración"}
          </span>
          {data?.fetchedAt && (
            <span style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>
              Última actualización: {fmtDate(data.fetchedAt)}
            </span>
          )}
          {data?.error && (
            <span className="badge badge-red" title={data.error}>
              ⚠️ Error al conectar — usando datos demo
            </span>
          )}
        </div>

        {/* KPIs */}
        {loading && !data ? (
          <div className="kpi-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="kpi-card" style={{ height: 96, animation: "shimmer-pulse 1.5s ease infinite" }} />
            ))}
          </div>
        ) : (
          <div className="kpi-grid">
            <div className="kpi-card green">
              <div className="kpi-label">Total ingresos</div>
              <div className="kpi-value gradient-text">${fmt(totalIngresos)}</div>
              <div className="kpi-unit">{data?.ingresos.length ?? 0} transacciones</div>
            </div>
            <div className="kpi-card red">
              <div className="kpi-label">Total egresos</div>
              <div className="kpi-value" style={{ color: "var(--danger)" }}>${fmt(totalEgresos)}</div>
              <div className="kpi-unit">{data?.egresos.length ?? 0} transacciones</div>
            </div>
            <div className={`kpi-card ${balance >= 0 ? "green" : "red"}`}>
              <div className="kpi-label">Balance neto</div>
              <div className="kpi-value" style={{ color: balance >= 0 ? "var(--accent)" : "var(--danger)" }}>
                {balance >= 0 ? "+" : ""}${fmt(balance)}
              </div>
              <div className="kpi-unit">ingresos − egresos</div>
            </div>
            <div className={`kpi-card ${margen >= 0 ? "blue" : "red"}`}>
              <div className="kpi-label">Margen</div>
              <div className="kpi-value" style={{ color: margen >= 20 ? "var(--accent)" : margen >= 0 ? "var(--accent2)" : "var(--danger)" }}>
                {margen}%
              </div>
              <div className="kpi-unit">utilidad sobre ingresos</div>
            </div>
          </div>
        )}

        {/* Chart + Insights */}
        <div className="two-col" style={{ marginBottom: "1rem" }}>

          {/* Monthly bar chart */}
          <div className="card">
            <div className="card-title">Ingresos vs Egresos por mes</div>
            <div style={{ display: "flex", gap: ".3rem", marginBottom: ".6rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: ".3rem", fontSize: ".72rem", color: "var(--text-muted)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(74,222,128,0.8)", display: "inline-block" }} />
                Ingresos
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: ".3rem", fontSize: ".72rem", color: "var(--text-muted)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(248,113,113,0.8)", display: "inline-block" }} />
                Egresos
              </span>
            </div>
            {monthly.length === 0 ? (
              <div className="empty"><div className="empty-icon">📊</div><p>Sin datos de meses.</p></div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: ".4rem", height: 150, overflowX: "auto" }}>
                {monthly.map((m) => (
                  <div key={m.key} style={{ flex: "0 0 auto", minWidth: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{ width: "100%", display: "flex", alignItems: "flex-end", gap: 2, height: 120 }}>
                      <div style={{
                        flex: 1,
                        background: "linear-gradient(to top, rgba(74,222,128,0.85), rgba(74,222,128,0.35))",
                        borderRadius: "4px 4px 0 0",
                        height: `${Math.round((m.ingresos / maxMonthly) * 100)}%`,
                        minHeight: 2,
                        transition: "height .5s ease",
                      }} />
                      <div style={{
                        flex: 1,
                        background: "linear-gradient(to top, rgba(248,113,113,0.85), rgba(248,113,113,0.35))",
                        borderRadius: "4px 4px 0 0",
                        height: `${Math.round((m.egresos / maxMonthly) * 100)}%`,
                        minHeight: 2,
                        transition: "height .5s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: ".58rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* IA Insights */}
          <div className="card">
            <div className="card-title">
              <span>🧠 Análisis automático</span>
            </div>
            {insights.length === 0 ? (
              <div className="empty"><div className="empty-icon">🤖</div><p>Cargando análisis…</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: ".7rem" }}>
                {insights.map((ins, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: ".65rem",
                    padding: ".7rem .85rem",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10,
                    borderLeft: `3px solid ${ins.color}`,
                  }}>
                    <span style={{ fontSize: "1rem", lineHeight: 1.3 }}>{ins.icon}</span>
                    <p style={{ fontSize: ".82rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>{ins.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top categories */}
        <div className="two-col" style={{ marginBottom: "1rem" }}>
          <div className="card">
            <div className="card-title">Top categorías de ingresos</div>
            <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
              {topIngresos.map((c) => (
                <div key={c.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".25rem" }}>
                    <span style={{ fontSize: ".8rem", color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: ".5rem" }}>{c.label}</span>
                    <span style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--text)", flexShrink: 0 }}>${fmt(c.total)}</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${c.pct}%`, background: "linear-gradient(90deg, rgba(74,222,128,0.8), rgba(163,230,53,0.6))", borderRadius: 4, transition: "width .5s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Top categorías de egresos</div>
            <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
              {topEgresos.map((c) => (
                <div key={c.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".25rem" }}>
                    <span style={{ fontSize: ".8rem", color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: ".5rem" }}>{c.label}</span>
                    <span style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--text)", flexShrink: 0 }}>${fmt(c.total)}</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${c.pct}%`, background: "linear-gradient(90deg, rgba(248,113,113,0.8), rgba(251,146,60,0.6))", borderRadius: 4, transition: "width .5s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions table */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <div className="card-title" style={{ margin: 0, flex: 1 }}>Detalle de transacciones</div>
            <div style={{ display: "flex", gap: ".4rem" }}>
              <button
                className={`btn ${activeTab === "ingresos" ? "btn-primary" : "btn-ghost"}`}
                style={{ padding: ".3rem .8rem", fontSize: ".78rem" }}
                onClick={() => setActiveTab("ingresos")}
              >
                ↑ Ingresos ({data?.ingresos.length ?? 0})
              </button>
              <button
                className={`btn ${activeTab === "egresos" ? "btn-danger" : "btn-ghost"}`}
                style={{ padding: ".3rem .8rem", fontSize: ".78rem" }}
                onClick={() => setActiveTab("egresos")}
              >
                ↓ Egresos ({data?.egresos.length ?? 0})
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="empty"><div className="empty-icon">📄</div><p>Sin datos disponibles.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tipo / Concepto</th>
                    <th>Importe</th>
                    <th>Día</th>
                    <th>Mes</th>
                    <th>Año</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const importe = parseFloat(row["Importe"] ?? "0") || 0;
                    return (
                      <tr key={i}>
                        <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                        <td><strong>{row["Tipo de gasto"] || "—"}</strong></td>
                        <td>
                          <span style={{ fontWeight: 700, color: activeTab === "ingresos" ? "var(--accent)" : "var(--danger)" }}>
                            {activeTab === "ingresos" ? "+" : "−"}${fmt(importe)}
                          </span>
                        </td>
                        <td>{row["Dia"] || "—"}</td>
                        <td>{MES_LABELS[row["Mes"]] ?? row["Mes"] ?? "—"}</td>
                        <td>{row["Año"] || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer-pulse {
          0%, 100% { opacity: .5; }
          50% { opacity: .8; }
        }
      `}</style>
    </>
  );
}
