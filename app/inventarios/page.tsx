"use client";

import { useState } from "react";

type Movimiento = {
  id: number;
  fecha: string;
  tipoMovimiento: string;
  productoId: number;
  loteId?: number;
  almacenOrigenId?: number;
  almacenDestinoId?: number;
  cantidad: number;
  unidad: string;
  motivo?: string;
  userId: number;
};

const TIPOS = ["entrada", "salida", "transferencia", "ajuste"];
const ALMACENES = [
  { id: 1, nombre: "Almacén Principal" },
  { id: 2, nombre: "En proceso" },
  { id: 3, nombre: "Producto terminado" },
  { id: 4, nombre: "Devoluciones" },
  { id: 5, nombre: "Almacén Secundario" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

const ALMACEN_NOMBRE: Record<number, string> = Object.fromEntries(
  ALMACENES.map((a) => [a.id, a.nombre])
);

const TIPO_BADGE: Record<string, string> = {
  entrada: "badge-green",
  salida: "badge-red",
  transferencia: "badge-blue",
  ajuste: "badge-orange",
};

export default function InventariosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    tipoMovimiento: "entrada",
    productoId: "1",
    loteId: "",
    almacenOrigenId: "",
    almacenDestinoId: "3",
    cantidad: "",
    unidad: "kg",
    motivo: "",
    userId: "1",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = {
        tipoMovimiento: form.tipoMovimiento,
        productoId: Number(form.productoId),
        cantidad: Number(form.cantidad),
        unidad: form.unidad,
        userId: Number(form.userId),
      };
      if (form.loteId) body.loteId = Number(form.loteId);
      if (form.almacenOrigenId) body.almacenOrigenId = Number(form.almacenOrigenId);
      if (form.almacenDestinoId) body.almacenDestinoId = Number(form.almacenDestinoId);
      if (form.motivo) body.motivo = form.motivo;

      const res = await fetch("/api/v1/inventarios/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setMovimientos((prev) => [data, ...prev]);
      setForm((prev) => ({ ...prev, cantidad: "", loteId: "", motivo: "" }));
      setMsg({ type: "success", text: "Movimiento registrado correctamente." });
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setLoading(false);
    }
  }

  const totalEntradas = movimientos.filter((m) => m.tipoMovimiento === "entrada")
    .reduce((a, m) => a + m.cantidad, 0);
  const totalSalidas = movimientos.filter((m) => m.tipoMovimiento === "salida")
    .reduce((a, m) => a + m.cantidad, 0);

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">📦 Inventarios OXDA</span>
        <span className="topbar-badge">Mayo 2026</span>
      </div>
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Control de Inventarios</h1>
          <p className="page-subtitle">Inventarios OXDA MAYO 2026 - Entradas, salidas, transferencias y ajustes</p>
        </div>

        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <div className="card" style={{ marginBottom: "1rem" }}>
          <div className="card-title">Nuevo movimiento</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Tipo de movimiento</label>
                <select className="form-input" value={form.tipoMovimiento} onChange={set("tipoMovimiento")}>
                  {TIPOS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Producto (ID)</label>
                <input className="form-input" type="number" min="1" value={form.productoId} onChange={set("productoId")} required />
              </div>
              <div className="form-group">
                <label className="form-label">Lote (opcional)</label>
                <input className="form-input" type="number" min="1" value={form.loteId} onChange={set("loteId")} placeholder="—" />
              </div>
              <div className="form-group">
                <label className="form-label">Almacén origen</label>
                <select className="form-input" value={form.almacenOrigenId} onChange={set("almacenOrigenId")}>
                  <option value="">— ninguno —</option>
                  {ALMACENES.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Almacén destino</label>
                <select className="form-input" value={form.almacenDestinoId} onChange={set("almacenDestinoId")}>
                  <option value="">— ninguno —</option>
                  {ALMACENES.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cantidad</label>
                <input className="form-input" type="number" min="0.001" step="0.001" value={form.cantidad} onChange={set("cantidad")} required placeholder="0.000" />
              </div>
              <div className="form-group">
                <label className="form-label">Unidad</label>
                <select className="form-input" value={form.unidad} onChange={set("unidad")}>
                  {["kg", "ton", "pza", "caja", "palet"].map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Motivo</label>
                <input className="form-input" type="text" value={form.motivo} onChange={set("motivo")} placeholder="Descripción del movimiento…" />
              </div>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Guardando…" : "✔ Registrar movimiento"}
              </button>
            </div>
          </form>
        </div>

        {movimientos.length > 0 && (
          <div className="kpi-grid" style={{ marginBottom: "1rem" }}>
            <div className="kpi-card green">
              <div className="kpi-label">Total entradas</div>
              <div className="kpi-value">{totalEntradas.toFixed(2)}</div>
              <div className="kpi-unit">kg / unidades</div>
            </div>
            <div className="kpi-card red">
              <div className="kpi-label">Total salidas</div>
              <div className="kpi-value">{totalSalidas.toFixed(2)}</div>
              <div className="kpi-unit">kg / unidades</div>
            </div>
            <div className="kpi-card blue">
              <div className="kpi-label">Movimientos</div>
              <div className="kpi-value">{movimientos.length}</div>
              <div className="kpi-unit">en esta sesión</div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-title">Kardex — sesión actual</div>
          {movimientos.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📦</div>
              <p>Sin movimientos en esta sesión.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Producto</th>
                    <th>Lote</th>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => (
                    <tr key={m.id}>
                      <td>{m.id}</td>
                      <td>{fmtDate(m.fecha)}</td>
                      <td>
                        <span className={`badge ${TIPO_BADGE[m.tipoMovimiento] ?? "badge-gray"}`}>
                          {m.tipoMovimiento}
                        </span>
                      </td>
                      <td>{m.productoId}</td>
                      <td>{m.loteId ?? "—"}</td>
                      <td>{m.almacenOrigenId ? ALMACEN_NOMBRE[m.almacenOrigenId] : "—"}</td>
                      <td>{m.almacenDestinoId ? ALMACEN_NOMBRE[m.almacenDestinoId] : "—"}</td>
                      <td><strong>{m.cantidad}</strong></td>
                      <td>{m.unidad}</td>
                      <td>{m.motivo ?? "—"}</td>
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
