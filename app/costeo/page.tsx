"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Database,
  Download,
  Package,
  Save,
  Search,
  Ship,
  Tags,
} from "lucide-react";
import {
  calculateProductCosting,
  type ProductCostingInput,
} from "@/lib/product-costing";

type ProductPrice = {
  id: number;
  listId: number;
  mode: string;
  range: string;
  priceUnit: string;
  price: number;
  order: number;
};

type PriceList = {
  id: number;
  key: string;
  name: string;
  validFrom: string;
  active: boolean;
};

type Product = {
  id: number;
  code: string;
  product: string;
  category: string;
  vulpesCode: string;
  availability: string;
  packageType: string;
  presentation: string;
  salesUnit: string;
  kgBox: number;
  costBox: number;
  generalPrice: number;
  active: boolean;
  costModel: ProductCostingInput;
  prices: ProductPrice[];
};

type ApiResponse = { items?: Product[]; lists?: PriceList[]; error?: string };
type Notice = { type: "success" | "error"; text: string } | null;

const money = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 });

function cloneProduct(product: Product): Product {
  return {
    ...product,
    costModel: { ...product.costModel },
    prices: product.prices.map((price) => ({ ...price })),
  };
}

function validDate(value: string) {
  if (!value) return "Sin vigencia";
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function representativePrice(product: Product) {
  return product.prices.find((price) => price.price > 0)?.price ?? 0;
}

export default function CostingPage() {
  const [activeView, setActiveView] = useState<"costeo" | "precios">("costeo");
  const [products, setProducts] = useState<Product[]>([]);
  const [lists, setLists] = useState<PriceList[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [draft, setDraft] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      setLoading(true);
      try {
        const response = await fetch("/api/v1/productos", { cache: "no-store" });
        const data = (await response.json()) as ApiResponse;
        if (!response.ok) throw new Error(data.error ?? "No fue posible cargar el catálogo");
        if (!active) return;
        const items = data.items ?? [];
        setProducts(items);
        setLists(data.lists ?? []);
        if (items.length) {
          setSelectedCode(items[0].code);
          setDraft(cloneProduct(items[0]));
        }
      } catch (error) {
        if (active) {
          setNotice({ type: "error", text: error instanceof Error ? error.message : "Error al cargar" });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  const selectedProduct = products.find((product) => product.code === selectedCode) ?? null;
  const dirty = Boolean(draft && selectedProduct && JSON.stringify(draft) !== JSON.stringify(selectedProduct));
  const costing = useMemo(
    () => (draft ? calculateProductCosting(draft.kgBox, draft.costModel) : null),
    [draft],
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-MX");
    if (!term) return products;
    return products.filter((product) =>
      [product.code, product.vulpesCode, product.product, product.category]
        .join(" ")
        .toLocaleLowerCase("es-MX")
        .includes(term),
    );
  }, [products, search]);

  const configuredProducts = products.filter((product) => product.prices.some((price) => price.price > 0)).length;
  const averageMargin = useMemo(() => {
    const margins = products
      .map((product) => {
        const price = representativePrice(product);
        return price > 0 && product.costBox > 0 ? ((price - product.costBox) / price) * 100 : null;
      })
      .filter((margin): margin is number => margin !== null);
    return margins.length ? margins.reduce((sum, margin) => sum + margin, 0) / margins.length : 0;
  }, [products]);

  function selectProduct(product: Product) {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Deseas descartarlos?")) return;
    setSelectedCode(product.code);
    setDraft(cloneProduct(product));
    setNotice(null);
  }

  function updateDraft<K extends keyof Product>(field: K, value: Product[K]) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function updatePrice(id: number, value: number) {
    setDraft((current) =>
      current
        ? {
            ...current,
            prices: current.prices.map((price) => (price.id === id ? { ...price, price: value } : price)),
          }
        : current,
    );
  }

  function updateCostModel<K extends keyof ProductCostingInput>(field: K, value: ProductCostingInput[K]) {
    setDraft((current) => current
      ? { ...current, costModel: { ...current.costModel, [field]: value } }
      : current);
  }

  function applyCalculatedValues() {
    if (!costing) return;
    const generalListIds = new Set(lists.filter((list) => list.key === "GENERAL").map((list) => list.id));
    const calculatedCost = Math.round(costing.landedCostPerBox * 10000) / 10000;
    const calculatedPrice = Math.round(costing.salePricePerBox * 100) / 100;
    setDraft((current) => current ? {
      ...current,
      costBox: calculatedCost,
      generalPrice: calculatedPrice,
      prices: current.prices.map((price) => generalListIds.has(price.listId)
        ? { ...price, price: calculatedPrice }
        : price),
    } : current);
  }

  async function saveProduct() {
    if (!draft) return;
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/v1/productos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No fue posible guardar el producto");
      const saved = cloneProduct(draft);
      setProducts((current) => current.map((product) => (product.code === saved.code ? saved : product)));
      setDraft(cloneProduct(saved));
      setNotice({ type: "success", text: `${saved.code} se guardó correctamente en Supabase.` });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Error al guardar" });
    } finally {
      setSaving(false);
    }
  }

  function exportPrices() {
    const listById = new Map(lists.map((list) => [list.id, list]));
    const rows: Array<Array<string | number>> = [
      ["CÓDIGO PRODUCTO", "CÓDIGO VULPES", "PRODUCTO", "CATEGORÍA", "LISTA", "VIGENCIA", "MODALIDAD", "RANGO", "PRECIO", "UNIDAD"],
    ];
    for (const product of products) {
      for (const price of product.prices) {
        const list = listById.get(price.listId);
        rows.push([
          product.code,
          product.vulpesCode,
          product.product,
          product.category,
          list?.name ?? "",
          list?.validFrom ?? "",
          price.mode,
          price.range,
          price.price,
          price.priceUnit,
        ]);
      }
    }
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    link.download = "catalogo-listas-precios-oxda.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="page" style={{ padding: "4px 4px 30px" }}>
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">Costeo, catálogo y listas de precios</h1>
          <p className="page-subtitle">Costeo de importación con fórmulas del Excel · edición persistente en Supabase</p>
        </div>
        <button className="btn btn-ghost" onClick={exportPrices} disabled={!products.length}>
          <Download size={16} /> Exportar catálogo
        </button>
      </header>

      {notice && (
        <div className={`alert ${notice.type === "success" ? "alert-success" : "alert-error"}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {notice.type === "success" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
          {notice.text}
        </div>
      )}

      <section className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-label"><Package size={14} /> Productos vigentes</div>
          <div className="kpi-value">{products.length}</div>
          <div className="kpi-unit">Catálogo maestro</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label"><Tags size={14} /> Con precio publicado</div>
          <div className="kpi-value">{configuredProducts}</div>
          <div className="kpi-unit">{products.length - configuredProducts} pendientes de precio</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label"><Database size={14} /> Listas ligadas</div>
          <div className="kpi-value">{lists.length}</div>
          <div className="kpi-unit">{lists.map((list) => list.key).join(" · ") || "Sin listas"}</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label">Margen de referencia</div>
          <div className="kpi-value">{averageMargin.toFixed(1)}%</div>
          <div className="kpi-unit">Sólo productos con costo y precio</div>
        </div>
      </section>

      <div className="costing-tabs" role="tablist" aria-label="Apartados del módulo de costeo">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "costeo"}
          className={`btn ${activeView === "costeo" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveView("costeo")}
        >
          <Calculator size={16} /> Costeo de importación
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "precios"}
          className={`btn ${activeView === "precios" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveView("precios")}
        >
          <Tags size={16} /> Catálogo y precios
        </button>
      </div>

      <div className="catalog-layout">
        <aside className="card catalog-sidebar">
          <div style={{ marginBottom: 14 }}>
            <h2 className="card-title" style={{ marginBottom: 4 }}>Productos</h2>
            <p className="page-subtitle">Selecciona uno para editar sus datos y precios.</p>
          </div>
          <label className="catalog-search">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Código, nombre o categoría" />
          </label>
          <div className="catalog-product-list">
            {loading && <p className="page-subtitle" style={{ padding: 12 }}>Cargando catálogo…</p>}
            {!loading && filteredProducts.length === 0 && <p className="page-subtitle" style={{ padding: 12 }}>No hay coincidencias.</p>}
            {filteredProducts.map((product) => {
              const productPrice = representativePrice(product);
              return (
                <button
                  key={product.code}
                  type="button"
                  className={`catalog-product${product.code === selectedCode ? " active" : ""}`}
                  onClick={() => selectProduct(product)}
                >
                  <span className="catalog-product-code">{product.code}</span>
                  <span className="catalog-product-name">{product.product}</span>
                  <span className="catalog-product-meta">
                    {product.category || "Sin categoría"} · {productPrice > 0 ? money(productPrice) : "Sin precio"}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="catalog-editor">
          {!draft ? (
            <div className="card empty">
              <div className="empty-icon">📦</div>
              <p>{loading ? "Cargando productos…" : "Selecciona un producto para comenzar."}</p>
            </div>
          ) : (
            <>
              <section className="card">
                <div className="catalog-editor-header">
                  <div>
                    <span className="badge badge-blue">Producto {draft.code}</span>
                    <h2 style={{ fontSize: "1.25rem", marginTop: 8 }}>{draft.product}</h2>
                    <p className="page-subtitle">El código de producto es la llave que liga todas las listas.</p>
                  </div>
                  <label className="catalog-active">
                    <input type="checkbox" checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} />
                    Producto activo
                  </label>
                </div>

                <div className="form-grid" style={{ marginTop: 18 }}>
                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label className="form-label">Nombre del producto</label>
                    <input className="form-input" value={draft.product} onChange={(event) => updateDraft("product", event.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Código de producto</label>
                    <input className="form-input" value={draft.code} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Código Vulpes</label>
                    <input className="form-input" value={draft.vulpesCode} onChange={(event) => updateDraft("vulpesCode", event.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <input className="form-input" value={draft.category} onChange={(event) => updateDraft("category", event.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Disponibilidad</label>
                    <select className="form-input" value={draft.availability} onChange={(event) => updateDraft("availability", event.target.value)}>
                      <option value="Stock">Stock</option>
                      <option value="Consolidado">Consolidado</option>
                      <option value="Sin asignar">Sin asignar</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo de empaque</label>
                    <input className="form-input" value={draft.packageType} onChange={(event) => updateDraft("packageType", event.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Presentación</label>
                    <input className="form-input" value={draft.presentation} onChange={(event) => updateDraft("presentation", event.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unidad de venta</label>
                    <input className="form-input" value={draft.salesUnit} onChange={(event) => updateDraft("salesUnit", event.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kg por caja</label>
                    <input className="form-input" type="number" min="0" step="0.001" value={draft.kgBox} onChange={(event) => updateDraft("kgBox", Number(event.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Costo por caja</label>
                    <input className="form-input" type="number" min="0" step="0.01" value={draft.costBox} onChange={(event) => updateDraft("costBox", Number(event.target.value))} />
                  </div>
                </div>
              </section>

              {activeView === "costeo" && costing && (
                <>
                  <section className="card">
                    <div className="price-list-heading">
                      <div>
                        <span className="badge badge-blue"><Ship size={12} /> Modelo de importación</span>
                        <h2 className="card-title" style={{ margin: "8px 0 0" }}>Supuestos del costeo</h2>
                      </div>
                      <span className="page-subtitle">Las salidas se recalculan al editar cualquier supuesto.</span>
                    </div>

                    <div className="costing-section-title">Contexto comercial</div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Zona</label>
                        <input className="form-input" value={draft.costModel.zone} onChange={(event) => updateCostModel("zone", event.target.value)} placeholder="Ej. Bajío" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Entrega</label>
                        <input className="form-input" value={draft.costModel.delivery} onChange={(event) => updateCostModel("delivery", event.target.value)} placeholder="Cliente o almacén OXDA" />
                      </div>
                      <div className="form-group" style={{ gridColumn: "span 2" }}>
                        <label className="form-label">Condiciones</label>
                        <input className="form-input" value={draft.costModel.conditions} onChange={(event) => updateCostModel("conditions", event.target.value)} placeholder="Condiciones comerciales y logísticas" />
                      </div>
                    </div>

                    <div className="costing-section-title">Contenedor y costos de origen</div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Cajas por tarima</label>
                        <input className="form-input" type="number" min="0.0001" step="0.0001" value={draft.costModel.boxesPerPallet} onChange={(event) => updateCostModel("boxesPerPallet", Number(event.target.value))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Tarimas por contenedor</label>
                        <input className="form-input" type="number" min="0.0001" step="0.0001" value={draft.costModel.palletsPerContainer} onChange={(event) => updateCostModel("palletsPerContainer", Number(event.target.value))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Moneda de origen</label>
                        <select className="form-input" value={draft.costModel.currency} onChange={(event) => updateCostModel("currency", event.target.value)}>
                          <option value="EUR/USD">EUR / USD</option>
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Precio origen por kg</label>
                        <input className="form-input" type="number" min="0" step="0.000001" value={draft.costModel.originPriceKg} onChange={(event) => updateCostModel("originPriceKg", Number(event.target.value))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Flete marítimo</label>
                        <input className="form-input" type="number" min="0" step="0.01" value={draft.costModel.seaFreight} onChange={(event) => updateCostModel("seaFreight", Number(event.target.value))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Tipo de cambio base</label>
                        <input className="form-input" type="number" min="0" step="0.000001" value={draft.costModel.exchangeRateBase} onChange={(event) => updateCostModel("exchangeRateBase", Number(event.target.value))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Factor tipo de cambio</label>
                        <input className="form-input" type="number" min="0" step="0.000001" value={draft.costModel.exchangeRateFactor} onChange={(event) => updateCostModel("exchangeRateFactor", Number(event.target.value))} />
                        <small className="page-subtitle">Excel: 1.025 = cobertura de 2.5%</small>
                      </div>
                    </div>

                    <div className="costing-section-title">Puerto, entrega y margen</div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Interés e impuestos (%)</label>
                        <input className="form-input" type="number" min="0" max="99.9999" step="0.01" value={draft.costModel.interestTaxRate * 100} onChange={(event) => updateCostModel("interestTaxRate", Number(event.target.value) / 100)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Gastos aduanales por contenedor</label>
                        <input className="form-input" type="number" min="0" step="0.01" value={draft.costModel.customsExpenses} onChange={(event) => updateCostModel("customsExpenses", Number(event.target.value))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Flete aduana a entrega</label>
                        <input className="form-input" type="number" min="0" step="0.01" value={draft.costModel.inlandFreight} onChange={(event) => updateCostModel("inlandFreight", Number(event.target.value))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Almacenaje por caja</label>
                        <input className="form-input" type="number" min="0" step="0.01" value={draft.costModel.storagePerBox} onChange={(event) => updateCostModel("storagePerBox", Number(event.target.value))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Margen objetivo (%)</label>
                        <input className="form-input" type="number" min="0" max="99.9999" step="0.01" value={draft.costModel.targetMargin * 100} onChange={(event) => updateCostModel("targetMargin", Number(event.target.value) / 100)} />
                        <small className="page-subtitle">Factor de recuperación: {(costing.recoveryFactor * 100).toFixed(2)}%</small>
                      </div>
                    </div>
                  </section>

                  <section className="card">
                    <div className="price-list-heading">
                      <div>
                        <span className="badge badge-green"><Calculator size={12} /> Resultado</span>
                        <h2 className="card-title" style={{ margin: "8px 0 0" }}>Costo puesto y precio objetivo</h2>
                      </div>
                      <button type="button" className="btn btn-ghost" onClick={applyCalculatedValues} disabled={costing.landedCostPerBox <= 0}>
                        Aplicar costo y precio al catálogo
                      </button>
                    </div>

                    <div className="costing-results">
                      <div><span>Cajas por contenedor</span><strong>{costing.boxesPerContainer.toLocaleString("es-MX", { maximumFractionDigits: 2 })}</strong></div>
                      <div><span>Kg por contenedor</span><strong>{costing.kgPerContainer.toLocaleString("es-MX", { maximumFractionDigits: 2 })}</strong></div>
                      <div><span>Tipo de cambio efectivo</span><strong>{costing.effectiveExchangeRate.toFixed(4)}</strong></div>
                      <div><span>Costo origen convertido/caja</span><strong>{money(costing.convertedOriginCostPerBox)}</strong></div>
                      <div className="primary"><span>Costo puesto por caja</span><strong>{money(costing.landedCostPerBox)}</strong></div>
                      <div className="primary"><span>Precio objetivo por caja</span><strong>{money(costing.salePricePerBox)}</strong></div>
                      <div><span>Precio objetivo por kg</span><strong>{money(costing.salePricePerKg)}</strong></div>
                      <div><span>Costo vigente en catálogo</span><strong>{money(draft.costBox)}</strong></div>
                    </div>

                    <div className="table-wrap" style={{ marginTop: 18 }}>
                      <table>
                        <thead><tr><th>Concepto</th><th>Fórmula del Excel</th><th style={{ textAlign: "right" }}>Resultado por caja</th></tr></thead>
                        <tbody>
                          <tr><td>Costo producto origen</td><td>Kg por caja × precio origen/kg</td><td style={{ textAlign: "right" }}>{money(costing.originCostPerBox)}</td></tr>
                          <tr><td>Flete marítimo</td><td>Flete marítimo ÷ cajas por contenedor</td><td style={{ textAlign: "right" }}>{money(costing.seaFreightPerBox)}</td></tr>
                          <tr><td>Total origen</td><td>Costo origen + flete marítimo</td><td style={{ textAlign: "right" }}>{costing.originTotalPerBox.toFixed(4)} {draft.costModel.currency}</td></tr>
                          <tr><td>Origen convertido</td><td>Total origen × tipo de cambio efectivo</td><td style={{ textAlign: "right" }}>{money(costing.convertedOriginCostPerBox)}</td></tr>
                          <tr><td>Interés e impuestos</td><td>Origen convertido × tasa</td><td style={{ textAlign: "right" }}>{money(costing.interestTaxPerBox)}</td></tr>
                          <tr><td>Gastos aduanales</td><td>Gastos del contenedor ÷ cajas</td><td style={{ textAlign: "right" }}>{money(costing.customsPerBox)}</td></tr>
                          <tr><td>Flete a entrega</td><td>Flete del contenedor ÷ cajas</td><td style={{ textAlign: "right" }}>{money(costing.inlandFreightPerBox)}</td></tr>
                          <tr><td>Almacenaje</td><td>Importe directo por caja</td><td style={{ textAlign: "right" }}>{money(costing.storagePerBox)}</td></tr>
                          <tr><td><strong>Costo puesto</strong></td><td>Suma de costos en moneda nacional</td><td style={{ textAlign: "right" }}><strong>{money(costing.landedCostPerBox)}</strong></td></tr>
                          <tr><td><strong>Precio objetivo</strong></td><td>Costo puesto ÷ (1 − margen objetivo)</td><td style={{ textAlign: "right" }}><strong>{money(costing.salePricePerBox)}</strong></td></tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}

              {activeView === "precios" && lists.map((list) => {
                const listPrices = draft.prices.filter((price) => price.listId === list.id);
                const modes = Array.from(new Set(listPrices.map((price) => price.mode)));
                return (
                  <section className="card" key={list.id}>
                    <div className="price-list-heading">
                      <div>
                        <span className="badge badge-green">{list.key}</span>
                        <h2 className="card-title" style={{ margin: "8px 0 0" }}>{list.name}</h2>
                      </div>
                      <span className="page-subtitle">Vigente desde {validDate(list.validFrom)}</span>
                    </div>
                    {listPrices.length === 0 ? (
                      <div className="catalog-no-prices">Este producto no tiene bandas configuradas en esta lista.</div>
                    ) : (
                      modes.map((mode) => (
                        <div key={mode} className="price-mode-block">
                          <h3>{mode === "RECOLECCION" ? "Recolección directa" : mode.charAt(0) + mode.slice(1).toLocaleLowerCase("es-MX")}</h3>
                          <div className="price-grid">
                            {listPrices
                              .filter((price) => price.mode === mode)
                              .sort((a, b) => a.order - b.order)
                              .map((price) => (
                                <label className="price-field" key={price.id}>
                                  <span>{price.range}</span>
                                  <div>
                                    <b>$</b>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={price.price}
                                      onChange={(event) => updatePrice(price.id, Number(event.target.value))}
                                    />
                                    <em>/{price.priceUnit.toLocaleLowerCase("es-MX")}</em>
                                  </div>
                                </label>
                              ))}
                          </div>
                        </div>
                      ))
                    )}
                  </section>
                );
              })}

              <div className="catalog-savebar">
                <div>
                  <strong>{dirty ? "Cambios pendientes" : "Producto sincronizado"}</strong>
                  <span>{dirty ? "Guarda para actualizar Supabase." : "No hay cambios por guardar."}</span>
                </div>
                <button className="btn btn-primary" onClick={saveProduct} disabled={!dirty || saving}>
                  <Save size={16} /> {saving ? "Guardando…" : "Guardar producto"}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
