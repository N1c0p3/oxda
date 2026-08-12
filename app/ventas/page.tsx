"use client";

import { useEffect, useState } from "react";
import { useZone } from "@/components/zone-filter";

type PedidoItem = { productoId: number; productoCodigo?: string; productoNombre?: string; cantidad: number; kgCaja?: number; precioUnitario: number };
type Pedido = {
  id: number;
  clienteId: number;
  cliente?: string;
  clienteCodigo?: string;
  items: PedidoItem[];
  comentarios?: string;
  subtotal: number;
  impuestos: number;
  total: number;
  estatus: string;
  fechaCompromiso?: string;
  createdAt: string;
  zona?: string;
  ejecutivo?: string;
};

type CustomerOption = { id: number; code: string; name: string; label: string; zone: string; seller: string };
type ProductOption = { id: number; code: string; vulpesCode: string; name: string; label: string; kgBox: number; salesUnit: string };
type PriceHistory = { customerCode: string; productCode: string; prices: Array<{ price: number; date: string; document: string }> };
type Catalogs = { customers: CustomerOption[]; products: ProductOption[]; priceHistory: PriceHistory[] };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

type PendienteItem = { id: string; cliente: string; producto: string; zona: string; cajas: number; kilos: number; avance: number; fechaCompromiso: string; ejecutivo: string; listo: boolean };

function toPendiente(pedido: Pedido): PendienteItem {
  return {
    id: String(pedido.id),
    cliente: pedido.cliente ?? `Cliente #${pedido.clienteId}`,
    producto: pedido.items.map((i) => i.productoNombre ?? `Producto #${i.productoId}`).join(", ") || "Sin productos",
    zona: pedido.zona || "—",
    cajas: pedido.items.reduce((sum, item) => sum + item.cantidad, 0),
    kilos: pedido.items.reduce((sum, item) => sum + item.cantidad * (item.kgCaja ?? 0), 0),
    avance: pedido.estatus === "listo" ? 100 : 0,
    fechaCompromiso: pedido.fechaCompromiso ?? new Date(pedido.createdAt).toISOString().slice(0, 10),
    ejecutivo: pedido.ejecutivo || "—",
    listo: pedido.estatus === "listo",
  };
}

export default function VentasPage() {
  const { zone } = useZone();
  const [vistaPedidos, setVistaPedidos] = useState<"nuevo" | "pendientes">("pendientes");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [catalogs, setCatalogs] = useState<Catalogs>({ customers: [], products: [], priceHistory: [] });

  useEffect(() => {
    fetch("/api/v1/ventas/pedidos")
      .then((res) => res.json())
      .then((data: { items?: Pedido[]; catalogs?: Catalogs }) => {
        setPedidos(data.items ?? []);
        setCatalogs(data.catalogs ?? { customers: [], products: [], priceHistory: [] });
        const firstCustomer = data.catalogs?.customers[0];
        const firstProduct = data.catalogs?.products[0];
        if (firstCustomer) setForm((current) => ({ ...current, clienteId: String(firstCustomer.id) }));
        if (firstProduct) {
          const recentPrice = firstCustomer
            ? data.catalogs?.priceHistory.find((entry) => entry.customerCode === firstCustomer.code && entry.productCode === firstProduct.code)?.prices[0]?.price
            : undefined;
          setItems([{ productoId: String(firstProduct.id), cantidad: "", precioUnitario: recentPrice ? String(recentPrice) : "" }]);
        }
      })
      .catch(() => setMsg({ type: "error", text: "No se pudieron cargar los pedidos" }));
  }, []);

  const pendientes = pedidos.filter((p) => p.estatus === "pendiente" || p.estatus === "capturado").map(toPendiente);

  function toggleListo(id: string) {
    setPedidos((prev) =>
      prev.map((p) =>
        String(p.id) === id
          ? { ...p, estatus: p.estatus === "listo" ? "pendiente" : "listo" }
          : p
      )
    );
  }

  const pendientesZona = zone === "TODAS" ? pendientes : pendientes.filter((item) => item.zona === zone);
  const pickingPromedio = pendientesZona.length
    ? Math.round(pendientesZona.reduce((sum, item) => sum + item.avance, 0) / pendientesZona.length)
    : 0;

  const [form, setForm] = useState({
    clienteId: "",
    fechaCompromiso: "",
    comentarios: "",
  });

  const [items, setItems] = useState<{ productoId: string; cantidad: string; precioUnitario: string }[]>([
    { productoId: "", cantidad: "", precioUnitario: "" },
  ]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const setItem = (i: number, k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [k]: e.target.value } : item));
  };

  const selectedCustomer = catalogs.customers.find((customer) => String(customer.id) === form.clienteId);

  function historyFor(productId: string) {
    const product = catalogs.products.find((item) => String(item.id) === productId);
    if (!selectedCustomer || !product) return [];
    return catalogs.priceHistory.find((entry) =>
      entry.customerCode === selectedCustomer.code && entry.productCode === product.code
    )?.prices ?? [];
  }

  function selectProduct(index: number, productId: string) {
    const history = historyFor(productId);
    setItems((current) => current.map((item, itemIndex) => itemIndex === index
      ? { ...item, productoId: productId, precioUnitario: history[0] ? String(history[0].price) : "" }
      : item));
  }

  function selectCustomer(clienteId: string) {
    const customer = catalogs.customers.find((item) => String(item.id) === clienteId);
    setForm((current) => ({ ...current, clienteId }));
    setItems((current) => current.map((item) => {
      const product = catalogs.products.find((entry) => String(entry.id) === item.productoId);
      const history = customer && product
        ? catalogs.priceHistory.find((entry) => entry.customerCode === customer.code && entry.productCode === product.code)?.prices ?? []
        : [];
      return { ...item, precioUnitario: history[0] ? String(history[0].price) : "" };
    }));
  }

  function addItem() {
    const firstProduct = catalogs.products[0];
    const recentPrice = firstProduct ? historyFor(String(firstProduct.id))[0]?.price : undefined;
    setItems((prev) => [...prev, {
      productoId: firstProduct ? String(firstProduct.id) : "",
      cantidad: "",
      precioUnitario: recentPrice ? String(recentPrice) : "",
    }]);
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
      const enriched: Pedido = {
        ...data,
        cliente: selectedCustomer?.name,
        clienteCodigo: selectedCustomer?.code,
        zona: selectedCustomer?.zone,
        ejecutivo: selectedCustomer?.seller,
        items: data.items.map((item: PedidoItem) => {
          const product = catalogs.products.find((entry) => entry.id === Number(item.productoId));
          return { ...item, productoCodigo: product?.code, productoNombre: product?.name, kgCaja: product?.kgBox };
        }),
      };
      setPedidos((prev) => [enriched, ...prev]);
      setForm((current) => ({ clienteId: current.clienteId, fechaCompromiso: "", comentarios: "" }));
      const firstProduct = catalogs.products[0];
      const recentPrice = firstProduct ? historyFor(String(firstProduct.id))[0]?.price : undefined;
      setItems([{
        productoId: firstProduct ? String(firstProduct.id) : "",
        cantidad: "",
        precioUnitario: recentPrice ? String(recentPrice) : "",
      }]);
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
        <span className="topbar-title">Reporte de Ventas OXDA</span>
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
                <div className="kpi-unit">{pendientesZona.reduce((sum, item) => sum + item.kilos, 0).toLocaleString("es-MX")} kg</div>
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
                      <th style={{ textAlign: "right" }}>Kg estimados</th>
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
                        <td style={{ textAlign: "right" }}>{p.kilos.toLocaleString("es-MX")}</td>
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
                <label className="form-label">Cliente · ID anexo</label>
                <select className="form-input" value={form.clienteId} onChange={(event) => selectCustomer(event.target.value)} required>
                  <option value="">Selecciona un cliente…</option>
                  {catalogs.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.label}</option>
                  ))}
                </select>
                {selectedCustomer && <small className="page-subtitle">{selectedCustomer.zone} · {selectedCustomer.seller || "Sin ejecutivo"}</small>}
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
                  {i === 0 && <label className="form-label">Producto</label>}
                  <select className="form-input" value={it.productoId} onChange={(event) => selectProduct(i, event.target.value)} required>
                    <option value="">Selecciona un producto…</option>
                    {catalogs.products.map((product) => (
                      <option key={product.id} value={product.id}>{product.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: "1 1 110px" }}>
                  {i === 0 && <label className="form-label">Cantidad (cajas)</label>}
                  <input className="form-input" type="number" min="0.001" step="0.001" value={it.cantidad} onChange={setItem(i, "cantidad")} required placeholder="0" />
                </div>
                <div className="form-group" style={{ flex: "1 1 130px" }}>
                  {i === 0 && <label className="form-label">Precio por caja</label>}
                  <input className="form-input" type="number" min="0" step="0.01" value={it.precioUnitario} onChange={setItem(i, "precioUnitario")} required placeholder="0.00" />
                  {historyFor(it.productoId).length > 0 && (
                    <select
                      className="form-input"
                      aria-label="Histórico de precios del cliente"
                      value=""
                      onChange={(event) => {
                        if (!event.target.value) return;
                        setItems((current) => current.map((item, index) => index === i ? { ...item, precioUnitario: event.target.value } : item));
                      }}
                      style={{ marginTop: 4, fontSize: 12 }}
                    >
                      <option value="">Histórico del cliente…</option>
                      {historyFor(it.productoId).map((history) => (
                        <option key={`${history.date}-${history.document}-${history.price}`} value={history.price}>
                          ${history.price.toLocaleString("es-MX")} · {history.date} · {history.document}
                        </option>
                      ))}
                    </select>
                  )}
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
                      <td>{p.clienteCodigo ?? p.clienteId}{p.cliente ? ` · ${p.cliente}` : ""}</td>
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
