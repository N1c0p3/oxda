"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, History, KeyRound, Link2, RefreshCw, Trash2, Unplug, UserPlus, X } from "lucide-react";
import MaggieLogo from "@/components/maggie-logo";
import { PROFILES, type ProfileId } from "@/lib/profiles";

const CLAVE_SESION = "oxda-telegram-admin";

type Revision = { ok: boolean; detalle: string };
type Estado = { claude: Revision; voz: Revision; bot: Revision; tablas: Revision; secreto: Revision; webhook: Revision };
type Vinculo = {
  id: number;
  nombre: string;
  perfil: ProfileId;
  activo: boolean;
  telegram_user_id: number | null;
  telegram_username: string | null;
  codigo_expira: string | null;
  vinculado_at: string | null;
  ultimo_mensaje_at: string | null;
};
type Accion = {
  id: string;
  autor: string;
  operaciones: Array<{ resumen: string }>;
  resultados: Array<{ ok: boolean; detalle: string }> | null;
  estatus: string;
  created_at: string;
};
type EnlaceNuevo = { nombre: string; enlace: string };

const REVISIONES: Array<{ clave: keyof Estado; etiqueta: string }> = [
  { clave: "tablas", etiqueta: "Base de datos" },
  { clave: "claude", etiqueta: "Claude" },
  { clave: "voz", etiqueta: "Voz (OpenAI)" },
  { clave: "bot", etiqueta: "Bot de Telegram" },
  { clave: "secreto", etiqueta: "Secreto del webhook" },
  { clave: "webhook", etiqueta: "Webhook" },
];

const ESTATUS_BADGE: Record<string, string> = {
  pendiente: "badge-blue",
  ejecutando: "badge-blue",
  ejecutada: "badge-green",
  parcial: "badge-orange",
  fallida: "badge-red",
  cancelada: "badge-gray",
};

function fecha(valor: string | null) {
  return valor ? new Date(valor).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—";
}

function nombrePerfil(perfil: ProfileId) {
  return PROFILES.find((item) => item.id === perfil)?.department ?? perfil;
}

function situacion(vinculo: Vinculo) {
  if (!vinculo.activo) return { texto: "Desactivado", badge: "badge-gray" };
  if (vinculo.telegram_user_id) return { texto: "Vinculado", badge: "badge-green" };
  if (vinculo.codigo_expira && new Date(vinculo.codigo_expira) > new Date()) return { texto: "Enlace pendiente", badge: "badge-orange" };
  return { texto: "Enlace vencido", badge: "badge-red" };
}

export default function TelegramPage() {
  const [clave, setClave] = useState("");
  const [claveEscrita, setClaveEscrita] = useState("");
  const [estado, setEstado] = useState<Estado | null>(null);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [nombre, setNombre] = useState("");
  const [perfil, setPerfil] = useState<ProfileId>("ventas");
  const [enlace, setEnlace] = useState<EnlaceNuevo | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [avisos, setAvisos] = useState("");

  const llamar = useCallback(async (ruta: string, metodo = "GET", cuerpo?: unknown, claveUsada = clave) => {
    const response = await fetch(ruta, {
      method: metodo,
      cache: "no-store",
      headers: { "Content-Type": "application/json", "x-admin-key": claveUsada },
      ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
    });
    const data = await response.json();
    if (!response.ok) {
      const fallo = new Error(data.error ?? "No fue posible completar la acción") as Error & { status?: number };
      fallo.status = response.status;
      throw fallo;
    }
    return data;
  }, [clave]);

  const cargar = useCallback(async (claveUsada: string) => {
    const nuevoEstado = (await llamar("/api/v1/telegram/estado", "GET", undefined, claveUsada)) as Estado;
    setEstado(nuevoEstado);
    if (!nuevoEstado.tablas.ok) return;
    const data = (await llamar("/api/v1/telegram/vinculos", "GET", undefined, claveUsada)) as { vinculos: Vinculo[]; acciones: Accion[] };
    setVinculos(data.vinculos);
    setAcciones(data.acciones);
  }, [llamar]);

  const entrar = useCallback(async (claveUsada: string) => {
    setOcupado(true);
    setError("");
    try {
      await cargar(claveUsada);
      setClave(claveUsada);
      sessionStorage.setItem(CLAVE_SESION, claveUsada);
    } catch (fallo) {
      sessionStorage.removeItem(CLAVE_SESION);
      setError(fallo instanceof Error ? fallo.message : "No fue posible entrar");
    } finally {
      setOcupado(false);
    }
  }, [cargar]);

  useEffect(() => {
    const guardada = sessionStorage.getItem(CLAVE_SESION);
    if (guardada) void entrar(guardada);
  }, [entrar]);

  async function ejecutar(accion: () => Promise<void>) {
    setOcupado(true);
    setError("");
    try {
      await accion();
      await cargar(clave);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No fue posible completar la acción");
    } finally {
      setOcupado(false);
    }
  }

  const crear = (evento: React.FormEvent) => {
    evento.preventDefault();
    void ejecutar(async () => {
      const data = await llamar("/api/v1/telegram/vinculos", "POST", { nombre, perfil });
      setEnlace({ nombre: data.vinculo.nombre, enlace: data.enlace });
      setCopiado(false);
      setNombre("");
    });
  };

  const regenerar = (vinculo: Vinculo) => {
    if (vinculo.telegram_user_id && !confirm(`¿Desconectar la cuenta actual de ${vinculo.nombre} y generar un enlace nuevo?`)) return;
    void ejecutar(async () => {
      const data = await llamar(`/api/v1/telegram/vinculos/${vinculo.id}`, "PATCH", { regenerar: true });
      setEnlace({ nombre: vinculo.nombre, enlace: data.enlace });
      setCopiado(false);
    });
  };

  const eliminar = (vinculo: Vinculo) => {
    if (!confirm(`¿Eliminar el acceso de ${vinculo.nombre}? Su conversación se borrará; el historial de cambios se conserva.`)) return;
    void ejecutar(async () => {
      await llamar(`/api/v1/telegram/vinculos/${vinculo.id}`, "DELETE");
    });
  };

  async function copiar() {
    if (!enlace) return;
    await navigator.clipboard.writeText(enlace.enlace);
    setCopiado(true);
  }

  if (!clave) {
    return (
      <div className="page" style={{ padding: "4px 4px 30px" }}>
        <header className="page-header">
          <h1 className="page-title">Vinculación de Maggie</h1>
          <p className="page-subtitle">Control de acceso</p>
        </header>
        <form className="card" style={{ maxWidth: 440 }} onSubmit={(evento) => { evento.preventDefault(); void entrar(claveEscrita); }}>
          <h2 className="card-title"><KeyRound size={17} /> Clave de administración</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label" htmlFor="clave-admin">Clave</label>
            <input id="clave-admin" className="form-input" type="password" autoComplete="current-password" value={claveEscrita} onChange={(evento) => setClaveEscrita(evento.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={ocupado}>{ocupado ? "Revisando…" : "Entrar"}</button>
        </form>
      </div>
    );
  }

  const listo = estado ? REVISIONES.every(({ clave: revision }) => estado[revision].ok) : false;
  const puedeActivar = Boolean(estado?.bot.ok && estado.secreto.ok);

  return (
    <div className="page" style={{ padding: "4px 4px 30px" }}>
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">Vinculación de Maggie</h1>
          <p className="page-subtitle">Vincula a tu equipo y revisa lo que cambian con Maggie</p>
        </div>
        <button className="btn btn-ghost" disabled={ocupado} onClick={() => void ejecutar(async () => undefined)}><RefreshCw size={15} /> Actualizar</button>
      </header>

      {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
      {avisos && <div className="alert alert-error" style={{ marginBottom: 14 }}>{avisos}</div>}

      <div className="card">
        <h2 className="card-title"><MaggieLogo size={18} aria-hidden="true" /> Estado de Maggie {listo && <span className="badge badge-green">Funcionando</span>}</h2>
        <div className="table-wrap"><table>
          <tbody>
            {estado && REVISIONES.map(({ clave: revision, etiqueta }) => (
              <tr key={revision}>
                <td style={{ width: 28 }}>{estado[revision].ok ? <Check size={16} aria-label="Correcto" /> : <X size={16} aria-label="Pendiente" />}</td>
                <td><strong>{etiqueta}</strong></td>
                <td>{estado[revision].detalle}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        {estado && !estado.webhook.ok && (
          <button
            className="btn btn-primary"
            style={{ marginTop: 14 }}
            disabled={ocupado || !puedeActivar}
            onClick={() => void ejecutar(async () => {
              const { avisos } = (await llamar("/api/v1/telegram/estado", "POST")) as { avisos?: string[] };
              if (avisos?.length) setAvisos(`El bot quedó activo, pero faltó aplicar: ${avisos.join("; ")}`);
            })}
          >
            <Link2 size={15} /> Activar a Maggie
          </button>
        )}
      </div>

      <div className="card">
        <h2 className="card-title"><UserPlus size={17} /> Vincular a una persona</h2>
        <form onSubmit={crear}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="vinculo-nombre">Nombre</label>
              <input id="vinculo-nombre" className="form-input" value={nombre} onChange={(evento) => setNombre(evento.target.value)} maxLength={120} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="vinculo-perfil">Perfil</label>
              <select id="vinculo-perfil" className="form-input" value={perfil} onChange={(evento) => setPerfil(evento.target.value as ProfileId)}>
                {PROFILES.map((item) => <option key={item.id} value={item.id}>{item.department}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={ocupado || !estado?.tablas.ok || !estado.bot.ok}>Generar enlace</button>
        </form>
        {enlace && (
          <div className="alert alert-success" style={{ marginTop: 14 }}>
            <p style={{ margin: "0 0 8px" }}>Enlace para {enlace.nombre}. Es de un solo uso, vence en 24 horas y no se volverá a mostrar.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <code style={{ wordBreak: "break-all", flex: "1 1 240px" }}>{enlace.enlace}</code>
              <button className="btn btn-ghost" type="button" onClick={() => void copiar()}><Copy size={15} /> {copiado ? "Copiado" : "Copiar"}</button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card-title"><Link2 size={17} /> Personas vinculadas</h2>
        {vinculos.length === 0 ? <p className="page-subtitle">Maggie todavía no tiene personas vinculadas.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Nombre</th><th>Perfil</th><th>Telegram</th><th>Estado</th><th>Última actividad</th><th>Acciones</th></tr></thead>
            <tbody>
              {vinculos.map((vinculo) => {
                const actual = situacion(vinculo);
                return (
                  <tr key={vinculo.id}>
                    <td><strong>{vinculo.nombre}</strong></td>
                    <td>
                      <select
                        className="form-input"
                        aria-label={`Perfil de ${vinculo.nombre}`}
                        value={vinculo.perfil}
                        disabled={ocupado}
                        onChange={(evento) => {
                          const nuevo = evento.target.value;
                          void ejecutar(async () => { await llamar(`/api/v1/telegram/vinculos/${vinculo.id}`, "PATCH", { perfil: nuevo }); });
                        }}
                      >
                        {PROFILES.map((item) => <option key={item.id} value={item.id}>{item.department}</option>)}
                      </select>
                    </td>
                    <td>{vinculo.telegram_username ? `@${vinculo.telegram_username}` : vinculo.telegram_user_id ?? "—"}</td>
                    <td><span className={`badge ${actual.badge}`}>{actual.texto}</span></td>
                    <td>{fecha(vinculo.ultimo_mensaje_at)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          className="btn btn-ghost"
                          disabled={ocupado}
                          onClick={() => void ejecutar(async () => { await llamar(`/api/v1/telegram/vinculos/${vinculo.id}`, "PATCH", { activo: !vinculo.activo }); })}
                        >
                          <Unplug size={14} /> {vinculo.activo ? "Desactivar" : "Activar"}
                        </button>
                        <button className="btn btn-ghost" disabled={ocupado} onClick={() => regenerar(vinculo)}><RefreshCw size={14} /> Nuevo enlace</button>
                        <button className="btn btn-danger" disabled={ocupado} aria-label={`Eliminar a ${vinculo.nombre}`} onClick={() => eliminar(vinculo)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </div>

      <div className="card">
        <h2 className="card-title"><History size={17} /> Cambios hechos con Maggie</h2>
        {acciones.length === 0 ? <p className="page-subtitle">Todavía no hay cambios registrados.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Fecha</th><th>Persona</th><th>Cambio</th><th>Resultado</th></tr></thead>
            <tbody>
              {acciones.map((accion) => (
                <tr key={accion.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{fecha(accion.created_at)}</td>
                  <td>{accion.autor}</td>
                  <td>{accion.operaciones.map((operacion, indice) => <div key={indice}>{operacion.resumen}</div>)}</td>
                  <td>
                    <span className={`badge ${ESTATUS_BADGE[accion.estatus] ?? "badge-gray"}`}>{accion.estatus}</span>
                    {accion.resultados?.filter((resultado) => !resultado.ok).map((resultado, indice) => <div key={indice} className="page-subtitle">{resultado.detalle}</div>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
