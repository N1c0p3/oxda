"use client";

import { useEffect, useState } from "react";

type Kpis = {
  kgProcesados: number;
  mermaPct: number;
  pedidos: number;
  envios: number;
  fillRate: number;
  ventasTotal: number;
};

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/dashboard/kpis")
      .then((r) => r.json())
      .then((data) => { setKpis(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Dashboard OXDA</span>
        <span className="topbar-badge">MAYO 2026</span>
      </div>
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Resumen Ejecutivo</h1>
          <p className="page-subtitle">Inventarios, ventas y operaciones al 13.05.2026</p>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Cargando KPIs…</p>
        ) : (
          <div className="kpi-grid">
            <div className="kpi-card green">
              <div className="kpi-label">Inventario Total</div>
              <div className="kpi-value">{kpis?.kgProcesados ?? 0}</div>
              <div className="kpi-unit">kg en almacén</div>
            </div>
            <div className="kpi-card orange">
              <div className="kpi-label">Ventas Mayo</div>
              <div className="kpi-value">{kpis?.mermaPct ?? 0}%</div>
              <div className="kpi-unit">vs mes anterior</div>
            </div>
            <div className="kpi-card blue">
              <div className="kpi-label">Pedidos Activos</div>
              <div className="kpi-value">{kpis?.pedidos ?? 0}</div>
              <div className="kpi-unit">en proceso</div>
            </div>
            <div className="kpi-card blue">
              <div className="kpi-label">Envíos Pendientes</div>
              <div className="kpi-value">{kpis?.envios ?? 0}</div>
              <div className="kpi-unit">por programar</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-label">Cumplimiento</div>
              <div className="kpi-value">{kpis?.fillRate ?? 0}%</div>
              <div className="kpi-unit">entregas a tiempo</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-label">Ventas Acumuladas</div>
              <div className="kpi-value">${(kpis?.ventasTotal ?? 0).toLocaleString("es-MX")}</div>
              <div className="kpi-unit">MXN hasta el 13.05</div>
            </div>
          </div>
        )}

        <div className="two-col">
          <div className="card">
            <div className="card-title">Acceso rápido</div>
            <table>
              <tbody>
                {[
                  { label: "Ver inventarios Mayo 2026", href: "/inventarios", icon: "📦" },
                  { label: "Reporte de ventas", href: "/ventas", icon: "�" },
                  { label: "Producción del turno", href: "/produccion", icon: "🏭" },
                  { label: "Programar envío", href: "/logistica", icon: "🚛" },
                  { label: "Gestión de clientes", href: "/crm", icon: "🤝" },
                ].map((item) => (
                  <tr key={item.href}>
                    <td>
                      <a href={item.href} style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                        <span>{item.icon}</span>
                        <span style={{ fontWeight: 600 }}>{item.label}</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-title">Módulos activos</div>
            <table>
              <thead>
                <tr>
                  <th>Módulo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Producción", status: "activo" },
                  { name: "Inventarios", status: "activo" },
                  { name: "Ventas / CRM", status: "activo" },
                  { name: "Logística", status: "activo" },
                  { name: "PostgreSQL", status: "demo" },
                  { name: "Autenticación JWT", status: "próximo" },
                ].map((m) => (
                  <tr key={m.name}>
                    <td>{m.name}</td>
                    <td>
                      <span className={
                        m.status === "activo" ? "badge badge-green" :
                        m.status === "demo" ? "badge badge-orange" :
                        "badge badge-gray"
                      }>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
