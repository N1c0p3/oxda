"use client";

import { useState } from "react";

type Envio = {
  id: number;
  pedidoId: number;
  rutaId?: number;
  operadorId?: number;
  unidadId?: number;
  fechaSalida?: string;
  estatus: string;
  createdAt: string;
  updatedAt?: string;
};

const ESTATUS = ["programado", "en_ruta", "enviado", "entregado", "devuelto"];

const ESTATUS_BADGE: Record<string, string> = {
  programado: "badge-blue",
  en_ruta:    "badge-orange",
  enviado:    "badge-orange",
  entregado:  "badge-green",
  devuelto:   "badge-red",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

export default function LogisticaPage() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    pedidoId: "1",
    rutaId: "",
    operadorId: "",
    unidadId: "",
    fechaSalida: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = { pedidoId: Number(form.pedidoId) };
      if (form.rutaId)      body.rutaId      = Number(form.rutaId);
      if (form.operadorId)  body.operadorId  = Number(form.operadorId);
      if (form.unidadId)    body.unidadId    = Number(form.unidadId);
      if (form.fechaSalida) body.fechaSalida = form.fechaSalida;

      const res = await fetch("/api/v1/logistica/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setEnvios((prev) => [data, ...prev]);
      setForm({ pedidoId: "1", rutaId: "", operadorId: "", unidadId: "", fechaSalida: "" });
      setMsg({ type: "success", text: `Envío #${data.id} programado correctamente.` });
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setLoading(false);
    }
  }

  async function actualizarEstatus(envioId: number, estatus: string) {
    setUpdatingId(envioId);
    try {
      const res = await fetch(`/api/v1/logistica/envios/${envioId}/estatus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setEnvios((prev) => prev.map((e) => e.id === envioId ? data : e));
    } catch {
      /* silent */
    } finally {
      setUpdatingId(null);
    }
  }

  const entregados  = envios.filter((e) => e.estatus === "entregado").length;
  const enRuta      = envios.filter((e) => ["en_ruta", "enviado"].includes(e.estatus)).length;

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">🚛 Logística</span>
        <span className="topbar-badge">Envíos y rutas</span>
      </div>
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Control de envíos</h1>
          <p className="page-subtitle">Programa rutas, asigna unidades y da seguimiento a cada entrega</p>
        </div>

        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <div className="card" style={{ marginBottom: "1rem" }}>
          <div className="card-title">Programar nuevo envío</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Pedido #</label>
                <input className="form-input" type="number" min="1" value={form.pedidoId} onChange={set("pedidoId")} required />
              </div>
              <div className="form-group">
                <label className="form-label">Ruta (ID)</label>
                <input className="form-input" type="number" min="1" value={form.rutaId} onChange={set("rutaId")} placeholder="—" />
              </div>
              <div className="form-group">
                <label className="form-label">Operador (ID)</label>
                <input className="form-input" type="number" min="1" value={form.operadorId} onChange={set("operadorId")} placeholder="—" />
              </div>
              <div className="form-group">
                <label className="form-label">Unidad (ID)</label>
                <input className="form-input" type="number" min="1" value={form.unidadId} onChange={set("unidadId")} placeholder="—" />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de salida</label>
                <input className="form-input" type="datetime-local" value={form.fechaSalida} onChange={set("fechaSalida")} />
              </div>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Guardando…" : "✔ Programar envío"}
              </button>
            </div>
          </form>
        </div>

        {envios.length > 0 && (
          <div className="kpi-grid" style={{ marginBottom: "1rem" }}>
            <div className="kpi-card blue">
              <div className="kpi-label">Envíos totales</div>
              <div className="kpi-value">{envios.length}</div>
            </div>
            <div className="kpi-card orange">
              <div className="kpi-label">En ruta</div>
              <div className="kpi-value">{enRuta}</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-label">Entregados</div>
              <div className="kpi-value">{entregados}</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-label">Fill rate</div>
              <div className="kpi-value">
                {envios.length ? Math.round((entregados / envios.length) * 100) : 0}%
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-title">Seguimiento de envíos</div>
          {envios.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🚛</div>
              <p>Sin envíos programados en esta sesión.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Envío #</th>
                    <th>Pedido</th>
                    <th>Ruta</th>
                    <th>Operador</th>
                    <th>Unidad</th>
                    <th>Fecha salida</th>
                    <th>Estatus</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {envios.map((e) => (
                    <tr key={e.id}>
                      <td><strong>{e.id}</strong></td>
                      <td>{e.pedidoId}</td>
                      <td>{e.rutaId ?? "—"}</td>
                      <td>{e.operadorId ?? "—"}</td>
                      <td>{e.unidadId ?? "—"}</td>
                      <td>{e.fechaSalida ? fmtDate(e.fechaSalida) : "—"}</td>
                      <td>
                        <span className={`badge ${ESTATUS_BADGE[e.estatus] ?? "badge-gray"}`}>
                          {e.estatus.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-input"
                          style={{ padding: ".25rem .5rem", fontSize: ".78rem" }}
                          value={e.estatus}
                          disabled={updatingId === e.id}
                          onChange={(ev) => actualizarEstatus(e.id, ev.target.value)}
                        >
                          {ESTATUS.map((s) => (
                            <option key={s} value={s}>{s.replace("_", " ")}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
