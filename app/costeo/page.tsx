"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, Calculator, Download, Megaphone, Package, Save } from "lucide-react";
import { BarChartComponent, ChartCard, StatCard } from "@/components/charts";
import { useZone } from "@/components/zone-filter";

type Product = { code: string; product: string; category: string; kgBox: number; costBox: number; price: number };

const money = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 });

export default function CostingPage() {
  const { zone } = useZone();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [targetMargin, setTargetMargin] = useState(22);
  const [publishedAt, setPublishedAt] = useState("");
  const [communications, setCommunications] = useState<Array<{ date: string; zone: string; products: number }>>([]);
  const selected = products.find((item) => item.code === selectedCode) ?? products[0];
  const suggestedPrice = selected ? selected.costBox / (1 - targetMargin / 100) : 0;

  useEffect(() => {
    fetch("/api/v1/productos")
      .then((res) => res.json())
      .then((data: { items?: Product[] }) => {
        const items = data.items ?? [];
        setProducts(items);
        if (items.length > 0 && !selectedCode) setSelectedCode(items[0].code);
      })
      .catch(() => setProducts([]));

    const savedCommunications = localStorage.getItem("oxda-price-communications");
    if (savedCommunications) {
      const history = JSON.parse(savedCommunications);
      setCommunications(history);
      setPublishedAt(history[0]?.date ?? "");
    }
  }, [selectedCode]);

  const averageMargin = useMemo(() =>
    products.length
      ? products.reduce((sum, item) => sum + ((item.price - item.costBox) / item.price) * 100, 0) / products.length
      : 0, [products]);

  const chart = products.map((item) => ({
    code: item.code,
    cost: item.costBox,
    price: item.price,
    margin: ((item.price - item.costBox) / item.price) * 100,
  }));

  async function applyPrice() {
    if (!selected) return;
    const newPrice = Math.round(suggestedPrice * 100) / 100;
    try {
      const res = await fetch("/api/v1/productos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: selected.code, price: newPrice }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      setProducts((current) => current.map((item) =>
        item.code === selected.code ? { ...item, price: newPrice } : item
      ));
    } catch {
      // fallback local
      setProducts((current) => current.map((item) =>
        item.code === selected.code ? { ...item, price: newPrice } : item
      ));
    }
  }

  function publishPrices() {
    const date = new Date().toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
    const next = [{ date, zone, products: products.length }, ...communications];
    setPublishedAt(date);
    setCommunications(next);
    localStorage.setItem("oxda-price-communications", JSON.stringify(next));
  }

  function exportPrices() {
    const rows = [
      ["CÓDIGO", "PRODUCTO", "CATEGORÍA", "ZONA", "PRECIO POR CAJA", "KG POR CAJA", "VIGENCIA"],
      ...products.map((item) => [item.code, item.product, item.category, zone, item.price, item.kgBox, "HASTA NUEVO AVISO"]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    link.download = `lista-precios-${zone}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="page" style={{ padding: "4px 4px 30px" }}>
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Costeo y precios</h1>
          <p className="page-subtitle">Calculadora por producto · lista comercial para {zone === "TODAS" ? "todas las zonas" : zone}</p>
        </div>
        <button className="btn btn-ghost" onClick={exportPrices}><Download size={16} /> Compartir lista</button>
      </header>

      {publishedAt && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <BellRing size={16} /> Lista publicada al equipo comercial el {publishedAt}.
        </div>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard title="Productos con precio" value={products.length} subtitle={`Vista vendedor · ${zone}`} trend="Lista vigente" trendUp icon={<Package size={19} color="#60a5fa" />} color="blue" />
        <StatCard title="Margen promedio" value={`${averageMargin.toFixed(1)}%`} subtitle="Ponderación simple de lista" trend="Precio − costo / precio" trendUp={averageMargin >= 20} icon={<Calculator size={19} color="#22c55e" />} color="green" />
        <StatCard title="Última comunicación" value={publishedAt ? "Publicada" : "Pendiente"} subtitle={publishedAt || "Sin publicar en esta sesión"} trend="Equipo comercial" trendUp={Boolean(publishedAt)} icon={<Megaphone size={19} color="#f59e0b" />} color="orange" />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px,1fr) minmax(0,2fr)", gap: 18, marginBottom: 18 }}>
        <div className="card">
          <h2 className="card-title"><Calculator size={17} /> Calculadora de precio</h2>
          {selected ? (
            <>
              <div className="form-group">
                <label className="form-label">Producto</label>
                <select className="form-input" value={selectedCode} onChange={(event) => setSelectedCode(event.target.value)}>
                  {products.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.product}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="form-group"><label className="form-label">Costo por caja</label><input className="form-input" value={money(selected.costBox)} readOnly /></div>
                <div className="form-group"><label className="form-label">Margen objetivo %</label><input className="form-input" type="number" min={1} max={90} value={targetMargin} onChange={(event) => setTargetMargin(Number(event.target.value))} /></div>
              </div>
              <div className="kpi-card blue" style={{ margin: "10px 0 14px" }}>
                <div className="kpi-label">Precio sugerido por caja</div>
                <div className="kpi-value">{money(suggestedPrice)}</div>
                <div className="kpi-unit">Fórmula: costo ÷ (1 − margen objetivo)</div>
              </div>
              <button className="btn btn-primary" onClick={applyPrice}><Save size={16} /> Aplicar a lista</button>
            </>
          ) : (
            <p className="page-subtitle">Cargando productos…</p>
          )}
        </div>

        <ChartCard title="Costo vs precio por producto" subtitle="Valores por caja">
          <BarChartComponent data={chart} dataKeys={[{ key: "cost", name: "Costo", color: "#f59e0b" }, { key: "price", name: "Precio", color: "#003087" }]} xAxisKey="code" height={320} />
        </ChartCard>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <div><h2 className="card-title" style={{ margin: 0 }}>Vista de precios para vendedores</h2><p className="page-subtitle">Código como identificador principal; importe mostrado por caja.</p></div>
          <button className="btn btn-primary" onClick={publishPrices}><Megaphone size={16} /> Publicar cambios</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Código / producto</th><th>Categoría</th><th>Kg/caja</th><th>Costo caja</th><th>Precio vendedor</th><th>Margen</th><th>Zona</th></tr></thead>
            <tbody>
              {products.map((item) => {
                const margin = ((item.price - item.costBox) / item.price) * 100;
                return (
                  <tr key={item.code}>
                    <td><strong style={{ color: "#60a5fa" }}>{item.code}</strong><small style={{ display: "block" }}>{item.product}</small></td>
                    <td>{item.category}</td>
                    <td>{item.kgBox}</td>
                    <td>{money(item.costBox)}</td>
                    <td><strong>{money(item.price)}</strong></td>
                    <td style={{ color: margin >= 20 ? "#22c55e" : "#f59e0b" }}>{margin.toFixed(1)}%</td>
                    <td><span className="badge badge-blue">{zone}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2 className="card-title"><BellRing size={16} /> Historial de comunicación al equipo comercial</h2>
        {communications.length === 0 ? <p className="page-subtitle">Aún no se han publicado cambios de precios.</p> : (
          <div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Zona</th><th>Productos comunicados</th><th>Canal</th></tr></thead><tbody>
            {communications.map((item, index) => <tr key={`${item.date}-${index}`}><td>{item.date}</td><td>{item.zone}</td><td>{item.products}</td><td><span className="badge badge-green">Aviso interno publicado</span></td></tr>)}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
}
