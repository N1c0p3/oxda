"use client";

import { useState } from "react";

type Captura = {
  id: number;
  ordenId: number;
  userId: number;
  areaId: number;
  turno: string;
  kgProcesado: number;
  kgMerma: number;
  minutosParo: number;
  incidencia?: string;
  fechaHora: string;
};

const AREAS = [
  { id: 1, nombre: "Recepción" },
  { id: 2, nombre: "Lavado / Selección" },
  { id: 3, nombre: "Corte / Proceso" },
  { id: 4, nombre: "Empaque" },
  { id: 5, nombre: "Control de Calidad" },
];

const TURNOS = ["Matutino", "Vespertino", "Nocturno"];

const AREA_NOMBRE: Record<number, string> = Object.fromEntries(
  AREAS.map((a) => [a.id, a.nombre])
);

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

export default function ProduccionPage() {
  const [capturas, setCapturas] = useState<Captura[]>([]);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    ordenId: "1",
    userId: "1",
    areaId: "1",
    turno: "Matutino",
    kgProcesado: "",
    kgMerma: "",
    minutosParo: "0",
    incidencia: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/v1/produccion/capturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ordenId: Number(form.ordenId),
          userId: Number(form.userId),
          areaId: Number(form.areaId),
          turno: form.turno,
          kgProcesado: Number(form.kgProcesado),
          kgMerma: Number(form.kgMerma),
          minutosParo: Number(form.minutosParo),
          incidencia: form.incidencia || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setCapturas((prev) => [data, ...prev]);
      setForm((prev) => ({ ...prev, kgProcesado: "", kgMerma: "", minutosParo: "0", incidencia: "" }));
      setMsg({ type: "success", text: "Captura registrada correctamente." });
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setLoading(false);
    }
  }

  const totalKg = capturas.reduce((a, c) => a + c.kgProcesado, 0);
  const totalMerma = capturas.reduce((a, c) => a + c.kgMerma, 0);
  const mermaPct = totalKg ? ((totalMerma / totalKg) * 100).toFixed(1) : "0.0";

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">🏭 Producción</span>
        <span className="topbar-badge">Captura operativa</span>
      </div>
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Captura de producción</h1>
          <p className="page-subtitle">Registra kilos procesados, merma y paros por orden y área</p>
        </div>

        {msg && (
          <div className={`alert alert-${msg.type}`}>{msg.text}</div>
        )}

        <div className="card" style={{ marginBottom: "1rem" }}>
          <div className="card-title">Nueva captura</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Orden de proceso #</label>
                <input className="form-input" type="number" min="1" value={form.ordenId} onChange={set("ordenId")} required />
              </div>
              <div className="form-group">
                <label className="form-label">Trabajador (ID)</label>
                <input className="form-input" type="number" min="1" value={form.userId} onChange={set("userId")} required />
              </div>
              <div className="form-group">
                <label className="form-label">Área</label>
                <select className="form-input" value={form.areaId} onChange={set("areaId")}>
                  {AREAS.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Turno</label>
                <select className="form-input" value={form.turno} onChange={set("turno")}>
                  {TURNOS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Kg procesados</label>
                <input className="form-input" type="number" min="0" step="0.01" value={form.kgProcesado} onChange={set("kgProcesado")} required placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Kg merma</label>
                <input className="form-input" type="number" min="0" step="0.01" value={form.kgMerma} onChange={set("kgMerma")} required placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Minutos de paro</label>
                <input className="form-input" type="number" min="0" value={form.minutosParo} onChange={set("minutosParo")} />
              </div>
              <div className="form-group">
                <label className="form-label">Incidencia (opcional)</label>
                <input className="form-input" type="text" value={form.incidencia} onChange={set("incidencia")} placeholder="Descripción breve…" />
              </div>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Guardando…" : "✔ Registrar captura"}
              </button>
            </div>
          </form>
        </div>

        {capturas.length > 0 && (
          <div className="kpi-grid" style={{ marginBottom: "1rem" }}>
            <div className="kpi-card green">
              <div className="kpi-label">Kg procesados (sesión)</div>
              <div className="kpi-value">{totalKg.toFixed(1)}</div>
            </div>
            <div className="kpi-card orange">
              <div className="kpi-label">Merma sesión</div>
              <div className="kpi-value">{mermaPct}%</div>
            </div>
            <div className="kpi-card blue">
              <div className="kpi-label">Capturas registradas</div>
              <div className="kpi-value">{capturas.length}</div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-title">Capturas del turno</div>
          {capturas.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📋</div>
              <p>Aún no hay capturas en esta sesión.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha / hora</th>
                    <th>Área</th>
                    <th>Turno</th>
                    <th>Kg proc.</th>
                    <th>Kg merma</th>
                    <th>Merma %</th>
                    <th>Paro (min)</th>
                    <th>Incidencia</th>
                  </tr>
                </thead>
                <tbody>
                  {capturas.map((c) => {
                    const mp = c.kgProcesado ? ((c.kgMerma / c.kgProcesado) * 100).toFixed(1) : "—";
                    return (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{fmtDate(c.fechaHora)}</td>
                        <td>{AREA_NOMBRE[c.areaId] ?? c.areaId}</td>
                        <td><span className="badge badge-blue">{c.turno}</span></td>
                        <td><strong>{c.kgProcesado}</strong></td>
                        <td>{c.kgMerma}</td>
                        <td>
                          <span className={`badge ${Number(mp) > 10 ? "badge-red" : "badge-green"}`}>
                            {mp}%
                          </span>
                        </td>
                        <td>{c.minutosParo}</td>
                        <td>{c.incidencia ?? <span style={{ color: "var(--muted)" }}>—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
