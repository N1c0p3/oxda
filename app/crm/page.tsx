"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Contact,
  Download,
  FileSearch,
  Filter,
  MapPin,
  MessageSquarePlus,
  Phone,
  Plus,
  Save,
  Search,
  Store,
  Trash2,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { OXDA_ZONES, useZone } from "@/components/zone-filter";

/* ---------- Tipos ---------- */
type Seguimiento = {
  id: string;
  fecha: string;
  tipo: "llamada" | "visita" | "correo" | "whatsapp" | "propuesta" | "otro";
  comentario: string;
  proximaAccion?: string;
  fechaProxima?: string;
};

type Prospecto = {
  id: string;
  fecha: string;
  asesor: string;
  canal: string;
  nombreProspecto: string;
  cargoProspecto: string;
  nombreNegocio: string;
  municipio: string;
  estado: string;
  contacto1: string;
  contacto2: string;
  correo: string;
  productoInteres?: string;
  zona: string;
  etapa: "nuevo" | "contactado" | "propuesta" | "negociacion" | "recuperacion" | "cerrado" | "perdido";
  notas?: string;
  seguimientos: Seguimiento[];
  creadoEn: string;
};

const ETAPAS: Prospecto["etapa"][] = [
  "nuevo",
  "contactado",
  "propuesta",
  "negociacion",
  "recuperacion",
  "cerrado",
  "perdido",
];

const ETAPA_LABEL: Record<Prospecto["etapa"], string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  propuesta: "Propuesta",
  negociacion: "Negociación",
  recuperacion: "Recuperación",
  cerrado: "Cerrado",
  perdido: "Perdido",
};

const ETAPA_BADGE: Record<Prospecto["etapa"], string> = {
  nuevo: "badge-gray",
  contactado: "badge-blue",
  propuesta: "badge-orange",
  negociacion: "badge-orange",
  recuperacion: "badge-blue",
  cerrado: "badge-green",
  perdido: "badge-red",
};

const CANALES = [
  "Llamada",
  "Visita",
  "WhatsApp",
  "Correo",
  "Redes sociales",
  "Referido",
  "Evento / feria",
  "Otro",
];

const ASESORES = ["Mario", "Gabriela", "Diego", "Gamaliel", "Adolfo", "Otro"];
const PRODUCTOS = [
  { codigo: "105632", nombre: "10 MM NATURAL" },
  { codigo: "102341", nombre: "10 MM CON COBERTURA" },
  { codigo: "102310", nombre: "7 MM CON COBERTURA" },
  { codigo: "114054", nombre: "GAJOS SAZONADOS" },
  { codigo: "102419", nombre: "PAPA ONDULADA" },
  { codigo: "260612", nombre: "CASTEL STRAIGHT CUT" },
  { codigo: "806982", nombre: "AROS DE CEBOLLA AVIKO" },
];

const TIPOS_SEGUIMIENTO: Seguimiento["tipo"][] = [
  "llamada",
  "visita",
  "correo",
  "whatsapp",
  "propuesta",
  "otro",
];

const STORAGE_KEY = "oxda-crm-prospectos";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { dateStyle: "medium" });
}

function hoyISO() {
  return new Date().toISOString().split("T")[0];
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ---------- Componente ---------- */
export default function CrmPage() {
  const { zone } = useZone();
  const [vista, setVista] = useState<"captura" | "prospectos" | "seguimientos">("captura");
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [cargado, setCargado] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState<Prospecto["etapa"] | "todas">("todas");
  const [msg, setMsg] = useState<{ tipo: "ok" | "error"; text: string } | null>(null);

  const [prospectoActivo, setProspectoActivo] = useState<Prospecto | null>(null);
  const [editando, setEditando] = useState<Prospecto | null>(null);

  const formInicial: Prospecto = useMemo(
    () => ({
      id: "",
      fecha: hoyISO(),
      asesor: ASESORES[0],
      canal: CANALES[0],
      nombreProspecto: "",
      cargoProspecto: "",
      nombreNegocio: "",
      municipio: "",
      estado: "",
      contacto1: "",
      contacto2: "",
      correo: "",
      productoInteres: "",
      zona: zone === "TODAS" ? "GDL" : zone,
      etapa: "nuevo",
      notas: "",
      seguimientos: [],
      creadoEn: "",
    }),
    [zone]
  );

  const [form, setForm] = useState<Prospecto>(formInicial);
  const [formSeg, setFormSeg] = useState<{
    fecha: string;
    tipo: Seguimiento["tipo"];
    comentario: string;
    proximaAccion: string;
    fechaProxima: string;
  }>({
    fecha: hoyISO(),
    tipo: "llamada",
    comentario: "",
    proximaAccion: "",
    fechaProxima: "",
  });

  /* Cargar / guardar localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProspectos(JSON.parse(raw).map((item: Prospecto) => ({ ...item, zona: item.zona || "GDL" })));
    } catch {
      /* ignore */
    }
    setCargado(true);
  }, []);

  useEffect(() => {
    if (!cargado) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prospectos));
  }, [prospectos, cargado]);

  function mostrarMsg(text: string, tipo: "ok" | "error" = "ok") {
    setMsg({ tipo, text });
    setTimeout(() => setMsg(null), 3500);
  }

  function resetForm() {
    setForm(formInicial);
    setEditando(null);
  }

  function guardarProspecto(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombreProspecto.trim() || !form.nombreNegocio.trim() || !form.contacto1.trim()) {
      mostrarMsg("Nombre del prospecto, negocio y número de contacto son obligatorios.", "error");
      return;
    }
    const phone = form.contacto1.replace(/\D/g, "");
    const secondaryPhone = form.contacto2.replace(/\D/g, "");
    if (phone.length !== 10 || /^(\d)\1{9}$/.test(phone) || ["1234567890", "0123456789", "0000000000"].includes(phone)) {
      mostrarMsg("El número principal parece inválido o posiblemente falso. Captura 10 dígitos válidos.", "error");
      return;
    }
    if (secondaryPhone && (secondaryPhone.length !== 10 || secondaryPhone === phone)) {
      mostrarMsg("El contacto alternativo es inválido o está repetido.", "error");
      return;
    }
    const duplicate = prospectos.find((item) =>
      item.id !== editando?.id &&
      ([item.contacto1, item.contacto2].map((value) => value.replace(/\D/g, "")).includes(phone) ||
        (secondaryPhone && [item.contacto1, item.contacto2].map((value) => value.replace(/\D/g, "")).includes(secondaryPhone)) ||
        item.nombreNegocio.trim().toUpperCase() === form.nombreNegocio.trim().toUpperCase())
    );
    if (duplicate) {
      mostrarMsg(`No se creó el registro: coincide con ${duplicate.nombreNegocio} (${duplicate.contacto1}).`, "error");
      return;
    }

    const payload: Prospecto = {
      ...form,
      id: editando ? editando.id : uid(),
      creadoEn: editando ? editando.creadoEn : new Date().toISOString(),
    };

    setProspectos((prev) => {
      if (editando) {
        return prev.map((p) => (p.id === payload.id ? payload : p));
      }
      return [payload, ...prev];
    });

    mostrarMsg(editando ? "Prospecto actualizado." : "Prospecto capturado correctamente.");
    resetForm();
    setVista("prospectos");
  }

  function eliminarProspecto(id: string) {
    if (!confirm("¿Eliminar este prospecto y todo su seguimiento?")) return;
    setProspectos((prev) => prev.filter((p) => p.id !== id));
    if (prospectoActivo?.id === id) setProspectoActivo(null);
    mostrarMsg("Prospecto eliminado.");
  }

  function abrirEditar(p: Prospecto) {
    setForm(p);
    setEditando(p);
    setVista("captura");
  }

  function abrirSeguimientos(p: Prospecto) {
    setProspectoActivo(p);
    setVista("seguimientos");
  }

  function agregarSeguimiento(e: React.FormEvent) {
    e.preventDefault();
    if (!prospectoActivo) return;
    if (!formSeg.comentario.trim()) {
      mostrarMsg("Escribe un comentario del seguimiento.", "error");
      return;
    }

    const seg: Seguimiento = {
      id: uid(),
      fecha: formSeg.fecha,
      tipo: formSeg.tipo,
      comentario: formSeg.comentario.trim(),
      proximaAccion: formSeg.proximaAccion.trim() || undefined,
      fechaProxima: formSeg.fechaProxima || undefined,
    };

    setProspectos((prev) =>
      prev.map((p) =>
        p.id === prospectoActivo.id
          ? { ...p, seguimientos: [seg, ...p.seguimientos] }
          : p
      )
    );

    setProspectoActivo((prev) =>
      prev ? { ...prev, seguimientos: [seg, ...prev.seguimientos] } : null
    );

    setFormSeg({
      fecha: hoyISO(),
      tipo: "llamada",
      comentario: "",
      proximaAccion: "",
      fechaProxima: "",
    });
    mostrarMsg("Seguimiento registrado.");
  }

  function eliminarSeguimiento(segId: string) {
    if (!prospectoActivo) return;
    if (!confirm("¿Eliminar este seguimiento?")) return;
    setProspectos((prev) =>
      prev.map((p) =>
        p.id === prospectoActivo.id
          ? { ...p, seguimientos: p.seguimientos.filter((s) => s.id !== segId) }
          : p
      )
    );
    setProspectoActivo((prev) =>
      prev
        ? { ...prev, seguimientos: prev.seguimientos.filter((s) => s.id !== segId) }
        : null
    );
  }

  const prospectosFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase().trim();
    return prospectos
      .filter((p) => zone === "TODAS" || p.zona === zone)
      .filter((p) => (filtroEtapa === "todas" ? true : p.etapa === filtroEtapa))
      .filter(
        (p) =>
          !term ||
          p.nombreProspecto.toLowerCase().includes(term) ||
          p.nombreNegocio.toLowerCase().includes(term) ||
          p.municipio.toLowerCase().includes(term) ||
          p.estado.toLowerCase().includes(term) ||
          p.asesor.toLowerCase().includes(term) ||
          p.correo.toLowerCase().includes(term)
      )
      .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
  }, [prospectos, busqueda, filtroEtapa, zone]);

  const totales = useMemo(() => {
    const scoped = prospectos.filter((p) => zone === "TODAS" || p.zona === zone);
    const total = scoped.length;
    const nuevo = scoped.filter((p) => p.etapa === "nuevo").length;
    const contactado = scoped.filter((p) => p.etapa === "contactado").length;
    const propuesta = scoped.filter((p) => p.etapa === "propuesta").length;
    const negociacion = scoped.filter((p) => p.etapa === "negociacion").length;
    const cerrado = scoped.filter((p) => p.etapa === "cerrado").length;
    const perdido = scoped.filter((p) => p.etapa === "perdido").length;
    const pendientes = scoped.filter(
      (p) =>
        p.seguimientos.length > 0 &&
        p.seguimientos[0].fechaProxima &&
        new Date(p.seguimientos[0].fechaProxima) >= new Date(hoyISO())
    ).length;
    return { total, nuevo, contactado, propuesta, negociacion, cerrado, perdido, pendientes };
  }, [prospectos, zone]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    const rawValue = e.target.value;
    const keepCase = ["fecha", "etapa", "asesor", "canal", "zona"].includes(name);
    setForm((prev) => ({ ...prev, [name]: keepCase ? rawValue : rawValue.toUpperCase() }));
  };

  function exportarProspectos() {
    const rows = [
      ["FECHA", "PROSPECTO", "NEGOCIO", "CONTACTO", "CORREO", "PRODUCTO", "ETAPA", "ASESOR", "ZONA"],
      ...prospectos.filter((item) => zone === "TODAS" || item.zona === zone).map((item) => [item.fecha, item.nombreProspecto, item.nombreNegocio, item.contacto1, item.correo, item.productoInteres ?? "", ETAPA_LABEL[item.etapa], item.asesor, item.zona]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    link.download = "prospectos-oxda.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const TabButton = ({
    keyVista,
    label,
    icon: Icon,
  }: {
    keyVista: typeof vista;
    label: string;
    icon: React.ElementType;
  }) => (
    <button
      onClick={() => setVista(keyVista)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 22px",
        borderRadius: "10px",
        border: "1px solid",
        borderColor: vista === keyVista ? "rgba(0,48,135,0.55)" : "rgba(255,255,255,0.10)",
        background: vista === keyVista ? "rgba(0,48,135,0.28)" : "rgba(255,255,255,0.04)",
        color: vista === keyVista ? "#fff" : "var(--text-muted)",
        fontSize: "13px",
        fontWeight: 700,
        cursor: "pointer",
        transition: "all .18s ease",
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">🤝 CRM</span>
        <span className="topbar-badge">Captura · Prospectos · Seguimiento</span>
      </div>

      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Centro de Captura y Seguimiento</h1>
          <p className="page-subtitle">
            Registra prospectos, administra su información y lleva el historial de seguimiento.
          </p>
        </div>

        {/* KPIs */}
        <div className="kpi-grid" style={{ marginBottom: "1.25rem" }}>
          <div className="kpi-card blue">
            <div className="kpi-label">Total prospectos</div>
            <div className="kpi-value">{totales.total}</div>
          </div>
          <div className="kpi-card orange">
            <div className="kpi-label">Nuevos</div>
            <div className="kpi-value">{totales.nuevo}</div>
          </div>
          <div className="kpi-card blue">
            <div className="kpi-label">En propuesta</div>
            <div className="kpi-value">{totales.propuesta + totales.negociacion}</div>
          </div>
          <div className="kpi-card green">
            <div className="kpi-label">Cerrados</div>
            <div className="kpi-value">{totales.cerrado}</div>
          </div>
          <div className="kpi-card orange">
            <div className="kpi-label">Seguimientos pendientes</div>
            <div className="kpi-value">{totales.pendientes}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <TabButton keyVista="captura" label="Captura" icon={Plus} />
          <TabButton keyVista="prospectos" label="Prospectos" icon={Users} />
          <TabButton keyVista="seguimientos" label="Seguimientos" icon={ClipboardList} />
        </div>

        {msg && (
          <div
            className={`alert alert-${msg.tipo === "ok" ? "success" : "error"}`}
            style={{ marginBottom: "1rem" }}
          >
            {msg.text}
          </div>
        )}

        {/* ================= VISTA CAPTURA ================= */}
        {vista === "captura" && (
          <div className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Contact size={18} />
              {editando ? "Editar prospecto" : "Nueva captura de prospecto"}
            </div>

            <form onSubmit={guardarProspecto}>
              <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div className="form-group">
                  <label className="form-label">
                    <CalendarDays size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                    Fecha de captura
                  </label>
                  <input
                    className="form-input"
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <UserCircle size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                    Asesor
                  </label>
                  <select className="form-input" name="asesor" value={form.asesor} onChange={handleChange}>
                    {ASESORES.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Canal o medio</label>
                  <select className="form-input" name="canal" value={form.canal} onChange={handleChange}>
                    {CANALES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Zona comercial</label>
                  <select className="form-input" name="zona" value={form.zona} onChange={handleChange}>
                    {OXDA_ZONES.filter((item) => item !== "TODAS").map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Nombre del prospecto</label>
                  <input
                    className="form-input"
                    type="text"
                    name="nombreProspecto"
                    value={form.nombreProspecto}
                    onChange={handleChange}
                    placeholder="Ej. Juan Pérez"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cargo del prospecto</label>
                  <input
                    className="form-input"
                    type="text"
                    name="cargoProspecto"
                    value={form.cargoProspecto}
                    onChange={handleChange}
                    placeholder="Ej. Gerente de compras"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label">
                    <Store size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                    Nombre del negocio
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="nombreNegocio"
                    value={form.nombreNegocio}
                    onChange={handleChange}
                    placeholder="Ej. Cremería Los Altos"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                    Municipio
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="municipio"
                    value={form.municipio}
                    onChange={handleChange}
                    placeholder="Ej. Guadalajara"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <input
                    className="form-input"
                    type="text"
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                    placeholder="Ej. Jalisco"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Phone size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                    Contacto 1
                  </label>
                  <input
                    className="form-input"
                    type="tel"
                    name="contacto1"
                    value={form.contacto1}
                    onChange={handleChange}
                    placeholder="10 dígitos · obligatorio"
                    minLength={10}
                    maxLength={14}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contacto 2</label>
                  <input
                    className="form-input"
                    type="tel"
                    name="contacto2"
                    value={form.contacto2}
                    onChange={handleChange}
                    placeholder="Teléfono alternativo"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Correo electrónico</label>
                  <input
                    className="form-input"
                    type="email"
                    name="correo"
                    value={form.correo}
                    onChange={handleChange}
                    placeholder="correo@negocio.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Producto de interés</label>
                  <select
                    className="form-input"
                    name="productoInteres"
                    value={form.productoInteres}
                    onChange={handleChange}
                  >
                    <option value="">SELECCIONA UN PRODUCTO…</option>
                    {PRODUCTOS.map((producto) => (
                      <option key={producto.codigo} value={`${producto.codigo} · ${producto.nombre}`}>{producto.codigo} · {producto.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Etapa actual</label>
                  <select className="form-input" name="etapa" value={form.etapa} onChange={handleChange}>
                    {ETAPAS.map((e) => (
                      <option key={e} value={e}>
                        {ETAPA_LABEL[e]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Notas adicionales</label>
                  <textarea
                    className="form-input"
                    name="notas"
                    rows={3}
                    value={form.notas}
                    onChange={handleChange}
                    placeholder="Observaciones, referencias, ubicación, etc."
                    style={{ resize: "vertical" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "1.25rem", flexWrap: "wrap" }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  {editando ? "Guardar cambios" : "Guardar prospecto"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={resetForm}>
                  <X size={16} />
                  Limpiar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= VISTA PROSPECTOS ================= */}
        {vista === "prospectos" && (
          <div className="card">
            <div
              className="card-title"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Users size={18} />
                Directorio de prospectos
              </span>
              <span style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost" onClick={exportarProspectos}>
                  <Download size={16} />
                  Exportar
                </button>
                <button className="btn btn-primary" onClick={() => { resetForm(); setVista("captura"); }}>
                  <Plus size={16} />
                  Nuevo prospecto
                </button>
              </span>
            </div>

            {/* Filtros */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
                marginBottom: "1rem",
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <Search size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                  Buscar
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Nombre, negocio, municipio, correo..."
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <Filter size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                  Etapa
                </label>
                <select
                  className="form-input"
                  value={filtroEtapa}
                  onChange={(e) => setFiltroEtapa(e.target.value as Prospecto["etapa"] | "todas")}
                >
                  <option value="todas">Todas</option>
                  {ETAPAS.map((e) => (
                    <option key={e} value={e}>
                      {ETAPA_LABEL[e]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {prospectosFiltrados.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🤝</div>
                <p>{prospectos.length === 0 ? "Aún no hay prospectos capturados." : "Ningún prospecto coincide con tu búsqueda."}</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Prospecto / Negocio</th>
                      <th>Contacto</th>
                      <th>Ubicación</th>
                      <th>Asesor</th>
                      <th>Canal</th>
                      <th>Etapa</th>
                      <th style={{ textAlign: "center" }}>Seg.</th>
                      <th style={{ textAlign: "center" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prospectosFiltrados.map((p) => (
                      <tr key={p.id}>
                        <td style={{ whiteSpace: "nowrap" }}>{fmtDate(p.fecha)}</td>
                        <td>
                          <strong>{p.nombreProspecto}</strong>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {p.nombreNegocio} {p.cargoProspecto ? `· ${p.cargoProspecto}` : ""}
                          </div>
                        </td>
                        <td>
                          {p.contacto1 && <div style={{ fontSize: "13px" }}>{p.contacto1}</div>}
                          {p.contacto2 && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p.contacto2}</div>}
                          {p.correo && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p.correo}</div>}
                        </td>
                        <td>
                          {p.municipio}
                          {p.estado && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p.estado}</div>}
                        </td>
                        <td>{p.asesor}</td>
                        <td>{p.canal}</td>
                        <td>
                          <span className={`badge ${ETAPA_BADGE[p.etapa]}`}>{ETAPA_LABEL[p.etapa]}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="badge badge-gray">{p.seguimientos.length}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: "5px 8px", fontSize: "12px" }}
                              onClick={() => abrirSeguimientos(p)}
                              title="Seguimientos"
                            >
                              <ClipboardList size={14} />
                            </button>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: "5px 8px", fontSize: "12px" }}
                              onClick={() => abrirEditar(p)}
                              title="Editar"
                            >
                              <FileSearch size={14} />
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: "5px 8px", fontSize: "12px" }}
                              onClick={() => eliminarProspecto(p.id)}
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= VISTA SEGUIMIENTOS ================= */}
        {vista === "seguimientos" && (
          <>
            <div className="card">
              <div className="card-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ClipboardList size={18} />
                  Seguimientos
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    className="form-input"
                    style={{ minWidth: 240 }}
                    value={prospectoActivo?.id || ""}
                    onChange={(e) => {
                      const p = prospectos.find((x) => x.id === e.target.value);
                      setProspectoActivo(p || null);
                    }}
                  >
                    <option value="">Selecciona un prospecto…</option>
                    {prospectos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombreProspecto} — {p.nombreNegocio}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-ghost" onClick={() => setVista("prospectos")}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {!prospectoActivo ? (
                <div className="empty">
                  <div className="empty-icon">📝</div>
                  <p>Selecciona un prospecto para ver o registrar seguimientos.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {/* Info del prospecto */}
                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Prospecto</div>
                      <div style={{ fontWeight: 700 }}>{prospectoActivo.nombreProspecto}</div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{prospectoActivo.cargoProspecto}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Negocio</div>
                      <div style={{ fontWeight: 700 }}>{prospectoActivo.nombreNegocio}</div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{prospectoActivo.correo}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Contactos</div>
                      <div style={{ fontSize: "13px" }}>{prospectoActivo.contacto1 || "—"}</div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{prospectoActivo.contacto2 || "—"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Ubicación</div>
                      <div style={{ fontSize: "13px" }}>{prospectoActivo.municipio}, {prospectoActivo.estado}</div>
                      <div style={{ marginTop: 4 }}>
                        <span className={`badge ${ETAPA_BADGE[prospectoActivo.etapa]}`}>{ETAPA_LABEL[prospectoActivo.etapa]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Formulario de seguimiento */}
                  <form onSubmit={agregarSeguimiento}>
                    <div style={{ fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 8 }}>
                      <MessageSquarePlus size={16} />
                      Registrar nuevo seguimiento
                    </div>
                    <div
                      className="form-grid"
                      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
                    >
                      <div className="form-group">
                        <label className="form-label">Fecha de seguimiento</label>
                        <input
                          className="form-input"
                          type="date"
                          value={formSeg.fecha}
                          onChange={(e) => setFormSeg((s) => ({ ...s, fecha: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Tipo de contacto</label>
                        <select
                          className="form-input"
                          value={formSeg.tipo}
                          onChange={(e) => setFormSeg((s) => ({ ...s, tipo: e.target.value as Seguimiento["tipo"] }))}
                        >
                          {TIPOS_SEGUIMIENTO.map((t) => (
                            <option key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label">Comentario / resultado</label>
                        <textarea
                          className="form-input"
                          rows={2}
                          value={formSeg.comentario}
                          onChange={(e) => setFormSeg((s) => ({ ...s, comentario: e.target.value }))}
                          placeholder="¿Qué se conversó, qué interés mostró, objeciones, etc.?"
                          style={{ resize: "vertical" }}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: "span 2" }}>
                        <label className="form-label">Próxima acción</label>
                        <input
                          className="form-input"
                          type="text"
                          value={formSeg.proximaAccion}
                          onChange={(e) => setFormSeg((s) => ({ ...s, proximaAccion: e.target.value }))}
                          placeholder="Ej. Enviar cotización, llamar de nuevo, visitar planta…"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Fecha próxima acción</label>
                        <input
                          className="form-input"
                          type="date"
                          value={formSeg.fechaProxima}
                          onChange={(e) => setFormSeg((s) => ({ ...s, fechaProxima: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: "1rem" }}>
                      <button type="submit" className="btn btn-primary">
                        <Save size={16} />
                        Guardar seguimiento
                      </button>
                    </div>
                  </form>

                  {/* Historial */}
                  <div style={{ marginTop: "0.5rem" }}>
                    <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ClipboardList size={16} />
                      Historial de seguimiento
                    </div>
                    {prospectoActivo.seguimientos.length === 0 ? (
                      <div className="empty" style={{ padding: "1.5rem 1rem" }}>
                        <div className="empty-icon">📝</div>
                        <p>Aún no hay seguimientos para este prospecto.</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {prospectoActivo.seguimientos
                          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                          .map((s) => (
                            <div
                              key={s.id}
                              style={{
                                padding: "14px 16px",
                                borderRadius: "12px",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                display: "grid",
                                gridTemplateColumns: "1fr auto",
                                gap: "12px",
                                alignItems: "start",
                              }}
                            >
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                                  <span className="badge badge-blue">{s.tipo.toUpperCase()}</span>
                                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{fmtDate(s.fecha)}</span>
                                  {s.fechaProxima && (
                                    <span className="badge badge-orange">Próx: {fmtDate(s.fechaProxima)}</span>
                                  )}
                                </div>
                                <div style={{ fontSize: "14px", lineHeight: 1.5 }}>{s.comentario}</div>
                                {s.proximaAccion && (
                                  <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: 6 }}>
                                    <strong>Próxima acción:</strong> {s.proximaAccion}
                                  </div>
                                )}
                              </div>
                              <button
                                className="btn btn-danger"
                                style={{ padding: "5px 8px" }}
                                onClick={() => eliminarSeguimiento(s.id)}
                                title="Eliminar seguimiento"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
