"use client";

import { useState } from "react";
import { useZone } from "@/components/zone-filter";

type PedidoItem = { productoId: number; cantidad: number; precioUnitario: number };
type Pedido = {
  id: number;
  clienteId: number;
  items: PedidoItem[];
  comentarios?: string;
  subtotal: number;
  impuestos: number;
  total: number;
  estatus: string;
  fechaCompromiso?: string;
  createdAt: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

type PendienteItem = { id: string; cliente: string; producto: string; zona: string; cajas: number; unidadesPorCaja: number; avance: number; fechaCompromiso: string; ejecutivo: string; listo: boolean };

const PENDIENTES_DEMO: PendienteItem[] = [
  { id: "P-001", cliente: "CREMERIA LOS ALTOS",    producto: "Papa Recta 3/8",           zona: "GDL", cajas: 120, unidadesPorCaja: 4,  avance: 25,  fechaCompromiso: "2026-06-25", ejecutivo: "Mario",    listo: false },
  { id: "P-002", cliente: "CRISTIAN IVAN ESTRADA", producto: "Frozen Straight Cut 3/8",  zona: "QR", cajas:  80, unidadesPorCaja: 4,  avance: 60,  fechaCompromiso: "2026-06-25", ejecutivo: "Mario",    listo: false },
  { id: "P-003", cliente: "OPERADORA VALIENTE",    producto: "Aviko Crunch Shoestring",  zona: "CS", cajas:  40, unidadesPorCaja: 5,  avance: 100, fechaCompromiso: "2026-06-26", ejecutivo: "Mario",    listo: true  },
  { id: "P-004", cliente: "JONATAN M. RAMIREZ",    producto: "Papa Castel Straight Cut", zona: "MEN VLP", cajas:  60, unidadesPorCaja: 4, avance: 40, fechaCompromiso: "2026-06-26", ejecutivo: "Gabriela", listo: false },
  { id: "P-005", cliente: "TREFOODS",              producto: "Papa Delgada 1/4",         zona: "MAY VLP", cajas:  35, unidadesPorCaja: 4, avance: 75, fechaCompromiso: "2026-06-27", ejecutivo: "Gabriela", listo: false },
  { id: "P-006", cliente: "EL SAZON 86",           producto: "Aves Mixto",               zona: "GDL", cajas:  18, unidadesPorCaja: 10, avance: 100, fechaCompromiso: "2026-06-27", ejecutivo: "Diego",    listo: true  },
];

export default function VentasPage() {
  const { zone } = useZone();
  const [vistaPedidos, setVistaPedidos] = useState<"nuevo" | "pendientes">("pendientes");
  const [pendientes, setPendientes] = useState<PendienteItem[]>(PENDIENTES_DEMO);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleListo(id: string) {
    setPendientes(prev => prev.map(p => p.id === id ? { ...p, listo: !p.listo, avance: p.listo ? 0 : 100 } : p));
  }

  const pendientesZona = zone === "TODAS" ? pendientes : pendientes.filter((item) => item.zona === zone);
  const pickingPromedio = pendientesZona.length
    ? Math.round(pendientesZona.reduce((sum, item) => sum + item.avance, 0) / pendientesZona.length)
    : 0;

  const [form, setForm] = useState({
    clienteId: "1",
    fechaCompromiso: "",
    comentarios: "",
  });

  const [items, setItems] = useState<{ productoId: string; cantidad: string; precioUnitario: string }[]>([
    { productoId: "1", cantidad: "", precioUnitario: "" },
  ]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const setItem = (i: number, k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [k]: e.target.value } : item));
  };

  function addItem() {
    setItems((prev) => [...prev, { productoId: "1", cantidad: "", precioUnitario: "" }]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/v1/ventas/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: Number(form.clienteId),
          fechaCompromiso: form.fechaCompromiso || undefined,
          comentarios: form.comentarios || undefined,
          items: items.map((it) => ({
            productoId: Number(it.productoId),
            cantidad: Number(it.cantidad),
            precioUnitario: Number(it.precioUnitario),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setPedidos((prev) => [data, ...prev]);
      setForm({ clienteId: "1", fechaCompromiso: "", comentarios: "" });
      setItems([{ productoId: "1", cantidad: "", precioUnitario: "" }]);
      setMsg({ type: "success", text: `Pedido #${data.id} creado — Total: $${data.total.toLocaleString("es-MX")}` });
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setLoading(false);
    }
  }

  const ventaTotal = pedidos.reduce((a, p) => a + p.total, 0);

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">� Reporte de Ventas OXDA</span>
        <span className="topbar-badge">Nuevo pedido · Pendientes</span>
      </div>
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Pedidos & Entregas</h1>
          <p className="page-subtitle">Crear pedidos · Lista de preparación de pendientes</p>
        </div>

        {/* Tab selector */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
          {(["pendientes", "nuevo"] as const).map(t => (
            <button key={t} onClick={() => setVistaPedidos(t)} style={{
              padding: "8px 20px", borderRadius: "8px", border: "1px solid",
              borderColor: vistaPedidos === t ? "var(--accent,#003087)" : "rgba(255,255,255,0.12)",
              background: vistaPedidos === t ? "rgba(0,48,135,0.3)" : "rgba(255,255,255,0.04)",
              color: vistaPedidos === t ? "#fff" : "var(--text-muted,rgba(255,255,255,0.55))",
              fontSize: "13px", fontWeight: 700, cursor: "pointer",
            }}>
              {t === "pendientes" ? `📋 Pendientes (${pendientes.filter(p=>!p.listo).length})` : "➕ Nuevo Pedido"}
            </button>
          ))}
        </div>

        {/* ── TAB PENDIENTES ── */}
        {vistaPedidos === "pendientes" && (
          <>
            <div className="kpi-grid" style={{ marginBottom: "1rem" }}>
              <div className="kpi-card orange">
                <div className="kpi-label">Por preparar</div>
                <div className="kpi-value">{pendientesZona.filter(p=>!p.listo).length}</div>
              </div>
              <div className="kpi-card green">
                <div className="kpi-label">Listos</div>
                <div className="kpi-value">{pendientesZona.filter(p=>p.listo).length}</div>
              </div>
              <div className="kpi-card blue">
                <div className="kpi-label">Cajas totales</div>
                <div className="kpi-value">{pendientesZona.reduce((s,p)=>s+p.cajas,0)}</div>
              </div>
              <div className="kpi-card blue">
                <div className="kpi-label">Avance de picking</div>
                <div className="kpi-value">{pickingPromedio}%</div>
                <div className="kpi-unit">{pendientesZona.reduce((sum, item) => sum + item.cajas * item.unidadesPorCaja, 0).toLocaleString("es-MX")} unidades</div>
              </div>
            </div>
            <div className="card">
              <div className="card-title">📋 Lista de Preparación</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>✔</th>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Producto</th>
                      <th style={{ textAlign: "right" }}>Cajas</th>
                      <th style={{ textAlign: "right" }}>Unidades</th>
                      <th>Compromiso</th>
                      <th>Ejecutivo</th>
                      <th>Picking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...pendientesZona].sort((a,b) => a.fechaCompromiso.localeCompare(b.fechaCompromiso)).map(p => (
                      <tr key={p.id} style={{ opacity: p.listo ? 0.5 : 1 }}>
                        <td>
                          <input type="checkbox" checked={p.listo} onChange={() => toggleListo(p.id)}
                            style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#22c55e" }} />
                        </td>
                        <td style={{ fontWeight: 700, color: "var(--accent-light,#60a5fa)" }}>{p.id}</td>
                        <td><strong style={{ textDecoration: p.listo ? "line-through" : "none" }}>{p.cliente}</strong></td>
                        <td style={{ color: "var(--text-muted)" }}>{p.producto}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{p.cajas}</td>
                        <td style={{ textAlign: "right" }}>{(p.cajas * p.unidadesPorCaja).toLocaleString("es-MX")}</td>
                        <td>{new Date(p.fechaCompromiso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}</td>
                        <td style={{ color: "var(--text-muted)" }}>{p.ejecutivo}</td>
                        <td style={{ minWidth: 150 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 7, borderRadius: 8, background: "rgba(148,163,184,.18)" }}>
                              <div style={{ width: `${p.avance}%`, height: "100%", borderRadius: 8, background: p.avance === 100 ? "#22c55e" : "#00a0e3" }} />
                            </div>
                            <strong>{p.avance}%</strong>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── TAB NUEVO PEDIDO ── */}
        {vistaPedidos === "nuevo" && (<>
        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <div className="card" style={{ marginBottom: "1rem" }}>
          <div className="card-title">Nuevo pedido</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ marginBottom: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Cliente (ID)</label>
                <input className="form-input" type="number" min="1" value={form.clienteId} onChange={set("clienteId")} required />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha compromiso</label>
                <input className="form-input" type="date" value={form.fechaCompromiso} onChange={set("fechaCompromiso")} />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Comentarios</label>
                <input className="form-input" type="text" value={form.comentarios} onChange={set("comentarios")} placeholder="Instrucciones especiales…" />
              </div>
            </div>

            <div className="card-title" style={{ marginBottom: ".6rem" }}>
              Productos del pedido
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: ".6rem", alignItems: "flex-end", marginBottom: ".6rem", flexWrap: "wrap" }}>
                <div className="form-group" style={{ flex: "1 1 100px" }}>
                  {i === 0 && <label className="form-label">Producto ID</label>}
                  <input className="form-input" type="number" min="1" value={it.productoId} onChange={setItem(i, "productoId")} required />
                </div>
                <div className="form-group" style={{ flex: "1 1 110px" }}>
                  {i === 0 && <label className="form-label">Cantidad (kg)</label>}
                  <input className="form-input" type="number" min="0.001" step="0.001" value={it.cantidad} onChange={setItem(i, "cantidad")} required placeholder="0.000" />
                </div>
                <div className="form-group" style={{ flex: "1 1 130px" }}>
                  {i === 0 && <label className="form-label">Precio unitario</label>}
                  <input className="form-input" type="number" min="0" step="0.01" value={it.precioUnitario} onChange={setItem(i, "precioUnitario")} required placeholder="0.00" />
                </div>
                {items.length > 1 && (
                  <button type="button" className="btn btn-ghost" onClick={() => removeItem(i)}>✕</button>
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: ".6rem", marginTop: ".5rem" }}>
              <button type="button" className="btn btn-ghost" onClick={addItem}>+ Agregar producto</button>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Guardando…" : "✔ Crear pedido"}
              </button>
            </div>
          </form>
        </div>

        {pedidos.length > 0 && (
          <div className="kpi-grid" style={{ marginBottom: "1rem" }}>
            <div className="kpi-card green">
              <div className="kpi-label">Pedidos creados</div>
              <div className="kpi-value">{pedidos.length}</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-label">Venta total sesión</div>
              <div className="kpi-value">${ventaTotal.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</div>
              <div className="kpi-unit">MXN con IVA</div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-title">Pedidos registrados</div>
          {pedidos.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🛒</div>
              <p>Aún no hay pedidos en esta sesión.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pedido #</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Compromiso</th>
                    <th>Subtotal</th>
                    <th>IVA</th>
                    <th>Total</th>
                    <th>Estatus</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.id}</strong></td>
                      <td>{fmtDate(p.createdAt)}</td>
                      <td>{p.clienteId}</td>
                      <td>{p.fechaCompromiso ?? "—"}</td>
                      <td>${p.subtotal.toLocaleString("es-MX")}</td>
                      <td>${p.impuestos.toLocaleString("es-MX")}</td>
                      <td><strong>${p.total.toLocaleString("es-MX")}</strong></td>
                      <td><span className="badge badge-orange">{p.estatus}</span></td>
                      <td>{p.items.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>)}
      </div>
    </>
  );
}
