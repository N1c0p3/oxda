import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextRequest } from "next/server";
import { z } from "zod/v4";

import { GET as getAnalisis } from "@/app/api/v1/analisis/route";
import { GET as getCartera } from "@/app/api/v1/cobranza/documentos/route";
import { GET as getComisiones, PATCH as patchComision } from "@/app/api/v1/comisiones/route";
import { GET as getOportunidades } from "@/app/api/v1/crm/oportunidades/route";
import { DELETE as deleteProspecto, PATCH as patchProspecto } from "@/app/api/v1/crm/prospectos/[id]/route";
import { DELETE as deleteSeguimiento, POST as postSeguimiento } from "@/app/api/v1/crm/prospectos/[id]/seguimientos/route";
import { GET as getProspectos, POST as postProspecto } from "@/app/api/v1/crm/prospectos/route";
import { GET as getKpis } from "@/app/api/v1/dashboard/kpis/route";
import { GET as getEstadisticas } from "@/app/api/v1/estadisticas/route";
import { GET as getAlmacenes } from "@/app/api/v1/inventarios/almacenes/route";
import { GET as getKardex, POST as postKardex } from "@/app/api/v1/inventarios/movimientos/route";
import { GET as getInventario, PATCH as patchCaducidad, POST as postMovimiento } from "@/app/api/v1/inventarios/reporte/route";
import { GET as getTransito } from "@/app/api/v1/inventarios/transito/route";
import { PATCH as patchEnvioEstatus } from "@/app/api/v1/logistica/envios/[envioId]/estatus/route";
import { GET as getEnvios, POST as postEnvio } from "@/app/api/v1/logistica/envios/route";
import { GET as getPredicciones } from "@/app/api/v1/predicciones/route";
import { GET as getDivisiones } from "@/app/api/v1/presupuestos/divisiones/route";
import { GET as getPresupuestos } from "@/app/api/v1/presupuestos/route";
import { GET as getProduccion, POST as postProduccion } from "@/app/api/v1/produccion/capturas/route";
import { GET as getProductos, PATCH as patchProducto } from "@/app/api/v1/productos/route";
import { GET as getResumen } from "@/app/api/v1/resumen/route";
import { GET as getAnalitica } from "@/app/api/v1/ventas/analitica/route";
import { GET as getPedidos, POST as postPedido } from "@/app/api/v1/ventas/pedidos/route";
import { inventorySnapshotProducts } from "@/lib/inventory-snapshot";
import { getProfile, type ProfileId } from "@/lib/profiles";
import { adminClient } from "@/lib/supabase/api";
import type { OperacionPropuesta, ResultadoOperacion } from "@/lib/telegram/store";

const LIMITE_FILAS = 100;
const LIMITE_TEXTO = 24_000;

type Respuesta = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Manejador<P> = (request: NextRequest, contexto: { params: Promise<P> }) => Promise<Response>;

/** Ejecuta el mismo handler que usa la interfaz, con sus validaciones y su forma de error. */
async function invocar<P = Record<string, never>>(
  manejador: Manejador<P>,
  ruta: string,
  opciones: { metodo?: string; cuerpo?: unknown; params?: P } = {},
): Promise<Respuesta> {
  const request = new NextRequest(`http://interno${ruta}`, {
    method: opciones.metodo ?? "GET",
    ...(opciones.cuerpo === undefined
      ? {}
      : { body: JSON.stringify(opciones.cuerpo), headers: { "Content-Type": "application/json" } }),
  });
  const response = await manejador(request, { params: Promise.resolve((opciones.params ?? {}) as P) });
  const data = (await response.json()) as Respuesta;
  if (!response.ok) throw new Error(String(data.error ?? `Error ${response.status}`));
  return data;
}

async function fila(tabla: string, columna: string, valor: string | number, columnas = "*") {
  const { data, error } = await adminClient().from(tabla).select(columnas).eq(columna, valor).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Respuesta | null;
}

async function exigirFila(tabla: string, id: number, etiqueta: string, columnas = "*") {
  const registro = await fila(tabla, "id", id, columnas);
  if (!registro) throw new Error(`No existe ${etiqueta} #${id}. Consulta el ID correcto antes de proponer el cambio.`);
  return registro;
}

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function diferencias(actual: Respuesta, cambios: Record<string, unknown>) {
  return Object.entries(cambios)
    .filter(([, nuevo]) => nuevo !== undefined)
    .map(([campo, nuevo]) => `${campo}: ${actual[campo] ?? "—"} → ${nuevo ?? "—"}`)
    .join("; ");
}

function dinero(valor: number) {
  return valor.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

/* ---------- Consultas ---------- */

type Modulo = { descripcion: string; rutas: string[]; leer: () => Promise<unknown> };

async function leerCatalogosOperacion() {
  const cliente = adminClient();
  const [usuarios, areas, unidades, almacenes, rutas, vehiculos, ordenes] = await Promise.all([
    cliente.from("usuarios").select("id, nombre, apellidos, activo").order("id"),
    cliente.from("areas").select("id, nombre").order("id"),
    cliente.from("unidades_medida").select("id, clave, nombre").order("id"),
    cliente.from("almacenes").select("id, nombre, tipo").order("id"),
    cliente.from("logistica_rutas").select("id, nombre, zona").order("id"),
    cliente.from("logistica_unidades").select("id, placa, tipo, estatus").order("id"),
    cliente.from("produccion_ordenes").select("id, producto_id, objetivo_kg, estatus").order("id", { ascending: false }).limit(50),
  ]);
  return {
    usuarios: usuarios.data ?? [],
    areas: areas.data ?? [],
    unidadesMedida: unidades.data ?? [],
    almacenes: almacenes.data ?? [],
    rutas: rutas.data ?? [],
    vehiculos: vehiculos.data ?? [],
    ordenesProduccion: ordenes.data ?? [],
  };
}

/** Campos sin ambigüedad: el modelo llegó a leer `sale: 44661` como una fecha. */
async function leerComisiones() {
  const { items } = await invocar(getComisiones, "/api/v1/comisiones");
  return (items as Array<{ id: string; seller: string; zone: string; sale: number; rate: number; status: string; paymentDate: string }>).map((item) => ({
    id: item.id,
    vendedor: item.seller,
    zona: item.zone,
    ventaFacturadaPesos: item.sale,
    tasaPorcentaje: item.rate,
    comisionPesos: Math.round(item.sale * item.rate) / 100,
    estatus: item.status,
    fechaPago: item.paymentDate || null,
  }));
}

const RUTAS_COMISIONES = ["/cuentas-por-pagar", "/logistica/prediccion"];

const MODULOS = {
  comisiones: { descripcion: "Comisiones por pagar", rutas: RUTAS_COMISIONES, leer: leerComisiones },
  prospectos: { descripcion: "Prospectos del CRM con sus seguimientos", rutas: ["/crm"], leer: async () => (await invocar(getProspectos, "/api/v1/crm/prospectos")).items },
  oportunidades: { descripcion: "Oportunidades del pipeline", rutas: ["/pipeline"], leer: async () => (await invocar(getOportunidades, "/api/v1/crm/oportunidades")).items },
  pedidos: { descripcion: "Pedidos capturados", rutas: ["/ventas"], leer: async () => (await invocar(getPedidos, "/api/v1/ventas/pedidos")).items },
  clientes: { descripcion: "Clientes con su id para capturar pedidos", rutas: ["/ventas"], leer: async () => (await invocar(getPedidos, "/api/v1/ventas/pedidos")).catalogs.customers },
  productos_venta: { descripcion: "Productos del catálogo con su id para pedidos y prospectos", rutas: ["/ventas", "/crm"], leer: async () => (await invocar(getPedidos, "/api/v1/ventas/pedidos")).catalogs.products },
  historial_precios: { descripcion: "Últimos precios por cliente y producto", rutas: ["/ventas"], leer: async () => (await invocar(getPedidos, "/api/v1/ventas/pedidos")).catalogs.priceHistory },
  costeo: { descripcion: "Catálogo con costos, modelo de costeo y precios por lista", rutas: ["/costeo"], leer: async () => (await invocar(getProductos, "/api/v1/productos")).items },
  listas_precios: { descripcion: "Listas de precios vigentes", rutas: ["/costeo"], leer: async () => (await invocar(getProductos, "/api/v1/productos")).lists },
  inventario: { descripcion: "Existencias del corte físico por producto y almacén", rutas: ["/inventarios/reporte"], leer: async () => (await invocar(getInventario, "/api/v1/inventarios/reporte")).products },
  movimientos_inventario: { descripcion: "Movimientos del Centro de Inventarios", rutas: ["/inventarios/reporte"], leer: async () => (await invocar(getInventario, "/api/v1/inventarios/reporte")).movements },
  kardex: { descripcion: "Kardex de movimientos por almacén", rutas: ["/inventarios"], leer: async () => (await invocar(getKardex, "/api/v1/inventarios/movimientos")).items },
  transito: { descripcion: "Inventario en tránsito", rutas: ["/inventarios/transito"], leer: async () => (await invocar(getTransito, "/api/v1/inventarios/transito")).items },
  almacenes: { descripcion: "Métricas por almacén", rutas: ["/inventarios/almacenes"], leer: () => invocar(getAlmacenes, "/api/v1/inventarios/almacenes") },
  envios: { descripcion: "Envíos y su estatus", rutas: ["/logistica"], leer: async () => (await invocar(getEnvios, "/api/v1/logistica/envios")).items },
  produccion: { descripcion: "Capturas de producción", rutas: ["/produccion"], leer: async () => (await invocar(getProduccion, "/api/v1/produccion/capturas")).items },
  cartera: { descripcion: "Documentos por cobrar", rutas: ["/cobranza"], leer: async () => (await invocar(getCartera, "/api/v1/cobranza/documentos")).items },
  presupuestos: { descripcion: "Presupuesto por zona y producto", rutas: ["/presupuestos/zona-producto"], leer: () => invocar(getPresupuestos, "/api/v1/presupuestos") },
  presupuesto_divisiones: { descripcion: "Presupuesto contra real por división", rutas: ["/presupuestos/zona-producto", "/ventas/vs-presupuesto"], leer: async () => (await invocar(getDivisiones, "/api/v1/presupuestos/divisiones")).items },
  ventas_analitica: { descripcion: "Analítica de ventas del año", rutas: ["/ventas/reporte"], leer: () => invocar(getAnalitica, "/api/v1/ventas/analitica") },
  resumen: { descripcion: "Resumen ejecutivo global", rutas: ["/resumen"], leer: () => invocar(getResumen, "/api/v1/resumen") },
  kpis: { descripcion: "Indicadores del dashboard", rutas: ["/dashboard"], leer: () => invocar(getKpis, "/api/v1/dashboard/kpis") },
  estadisticas: { descripcion: "Estadísticas comerciales", rutas: ["/estadisticas"], leer: () => invocar(getEstadisticas, "/api/v1/estadisticas") },
  predicciones: { descripcion: "Predicción de demanda y reabasto", rutas: ["/logistica/prediccion"], leer: () => invocar(getPredicciones, "/api/v1/predicciones") },
  analisis: { descripcion: "Análisis avanzado", rutas: ["/analisis"], leer: () => invocar(getAnalisis, "/api/v1/analisis") },
  catalogos_operacion: { descripcion: "IDs de usuarios, áreas, unidades de medida, almacenes, rutas, vehículos y órdenes de producción", rutas: ["/inventarios", "/produccion", "/logistica"], leer: leerCatalogosOperacion },
} satisfies Record<string, Modulo>;

type NombreModulo = keyof typeof MODULOS;

export function puedeAcceder(perfil: ProfileId, rutas: string[]) {
  const permitidas = getProfile(perfil)?.allowedRoutes ?? [];
  return rutas.some((ruta) => permitidas.includes(ruta));
}

export async function consultarModulo(modulo: NombreModulo, buscar?: string, limite = 30) {
  const datos = await MODULOS[modulo].leer();
  if (!Array.isArray(datos)) {
    const texto = JSON.stringify(datos);
    return texto.length > LIMITE_TEXTO
      ? `${texto.slice(0, LIMITE_TEXTO)}… [respuesta recortada; pide un dato más específico]`
      : texto;
  }
  const terminos = normalizar(buscar ?? "").split(/\s+/).filter(Boolean);
  const coincidencias = terminos.length
    ? datos.filter((registro) => {
        const texto = normalizar(JSON.stringify(registro));
        return terminos.every((termino) => texto.includes(termino));
      })
    : datos;
  const filas = coincidencias.slice(0, Math.min(limite, LIMITE_FILAS));
  return JSON.stringify({ total: coincidencias.length, mostrados: filas.length, filas }).slice(0, LIMITE_TEXTO);
}

/* ---------- Operaciones de escritura ---------- */

type Operacion<S extends z.ZodType = z.ZodType> = {
  nombre: string;
  descripcion: string;
  rutas: string[];
  esquema: S;
  /** Comprueba contra datos reales y redacta el renglón de la tarjeta. */
  previsualizar: (entrada: z.infer<S>) => Promise<string>;
  ejecutar: (entrada: z.infer<S>) => Promise<string>;
};

function definir<S extends z.ZodType>(operacion: Operacion<S>) {
  return operacion as unknown as Operacion;
}

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Fecha AAAA-MM-DD");
const texto = z.string().trim().min(1);
const id = z.number().int().positive();

const ETAPAS = ["nuevo", "contactado", "propuesta", "negociacion", "recuperacion", "cerrado", "perdido"] as const;
const camposProspecto = {
  fecha: fecha.optional(),
  asesor: texto.describe("Mario, Gabriela, Diego, Gamaliel, Adolfo u Otro"),
  canal: texto.describe("Llamada, Visita, WhatsApp, Correo, Redes sociales, Referido, Evento / feria u Otro"),
  nombre_prospecto: texto,
  cargo_prospecto: z.string().nullable().optional(),
  nombre_negocio: texto,
  municipio: z.string().nullable().optional(),
  estado: z.string().nullable().optional(),
  contacto1: z.string().nullable().optional(),
  contacto2: z.string().nullable().optional(),
  correo: z.string().nullable().optional(),
  producto_interes_id: id.nullable().optional().describe("id de productos_venta"),
  zona: texto.describe("GDL, QR, CS, BAJÍO - MAYOREO o CONTENEDOR COMPLETO"),
  etapa: z.enum(ETAPAS),
  notas: z.string().nullable().optional(),
};

function prospectoParaApi(entrada: Partial<Record<keyof typeof camposProspecto, unknown>>) {
  return {
    fecha: entrada.fecha,
    asesor: entrada.asesor,
    canal: entrada.canal,
    nombreProspecto: entrada.nombre_prospecto,
    cargoProspecto: entrada.cargo_prospecto,
    nombreNegocio: entrada.nombre_negocio,
    municipio: entrada.municipio,
    estado: entrada.estado,
    contacto1: entrada.contacto1,
    contacto2: entrada.contacto2,
    correo: entrada.correo,
    productoInteresId: entrada.producto_interes_id,
    zona: entrada.zona,
    etapa: entrada.etapa,
    notas: entrada.notas,
  };
}

const seguimiento = z.object({
  tipo: z.enum(["llamada", "visita", "correo", "whatsapp", "propuesta", "otro"]),
  comentario: texto,
  fecha: fecha.optional(),
  proxima_accion: z.string().optional(),
  fecha_proxima: fecha.optional(),
});

function seguimientoParaApi(entrada: z.infer<typeof seguimiento>) {
  return {
    tipo: entrada.tipo,
    comentario: entrada.comentario,
    fecha: entrada.fecha,
    proximaAccion: entrada.proxima_accion,
    fechaProxima: entrada.fecha_proxima,
  };
}

const cambiosProducto = z.object({
  product: texto.describe("Nombre"),
  category: z.string(),
  vulpesCode: z.string(),
  availability: z.string(),
  packageType: z.string(),
  presentation: z.string(),
  salesUnit: z.string(),
  kgBox: z.number().min(0),
  costBox: z.number().min(0).describe("Costo por caja"),
  active: z.boolean(),
}).partial();

const cambiosCosteo = z.object({
  zone: z.string(),
  delivery: z.string(),
  conditions: z.string(),
  currency: z.string(),
  boxesPerPallet: z.number().positive(),
  palletsPerContainer: z.number().positive(),
  originPriceKg: z.number().min(0),
  seaFreight: z.number().min(0),
  exchangeRateBase: z.number().min(0),
  exchangeRateFactor: z.number().min(0),
  interestTaxRate: z.number().min(0).lt(1).describe("Fracción: 0.16 es 16%"),
  customsExpenses: z.number().min(0),
  inlandFreight: z.number().min(0),
  storagePerBox: z.number().min(0),
  targetMargin: z.number().min(0).lt(1).describe("Fracción: 0.25 es 25%"),
}).partial();

const actualizarProducto = z.object({
  codigo: texto.describe("Código (code) del producto en costeo"),
  producto: cambiosProducto.optional(),
  precios: z.array(z.object({ id, precio: z.number().min(0) })).optional().describe("id del renglón en prices"),
  costeo: cambiosCosteo.optional(),
});

/** La API exige el producto completo; se mezcla sobre su estado vigente al previsualizar y al ejecutar. */
async function productoConCambios(entrada: z.infer<typeof actualizarProducto>) {
  const { items } = await invocar(getProductos, "/api/v1/productos");
  const actual = (items as Respuesta[]).find((item) => item.code === entrada.codigo);
  if (!actual) throw new Error(`No existe el producto con código ${entrada.codigo} en el catálogo`);
  const precios = new Map((entrada.precios ?? []).map((cambio) => [cambio.id, cambio.precio]));
  for (const precioId of precios.keys()) {
    if (!(actual.prices as Respuesta[]).some((precio) => precio.id === precioId)) {
      throw new Error(`El renglón de precio ${precioId} no pertenece a ${entrada.codigo}`);
    }
  }
  return {
    actual,
    borrador: {
      ...actual,
      ...entrada.producto,
      costModel: { ...actual.costModel, ...entrada.costeo },
      prices: (actual.prices as Respuesta[]).map((precio) => ({ ...precio, price: precios.get(precio.id) ?? precio.price })),
    },
  };
}

const OPERACIONES: Operacion[] = [
  definir({
    nombre: "actualizar_comision",
    descripcion: "Cambia tasa (%), estatus o fecha de pago de una comisión.",
    rutas: RUTAS_COMISIONES,
    esquema: z.object({
      id,
      tasa: z.number().min(0).max(100).optional(),
      estatus: z.enum(["Por autorizar", "Programada", "Pagada"]).optional(),
      fecha_pago: fecha.optional(),
    }),
    previsualizar: async ({ id: comisionId, ...cambios }) => {
      const actual = await exigirFila("comisiones", comisionId, "la comisión");
      return `Comisión #${comisionId} de ${actual.vendedor}: ${diferencias(actual, { tasa: cambios.tasa, estatus: cambios.estatus, fecha_pago: cambios.fecha_pago })}`;
    },
    ejecutar: async ({ id: comisionId, tasa, estatus, fecha_pago }) => {
      const data = await invocar(patchComision, "/api/v1/comisiones", {
        metodo: "PATCH",
        cuerpo: { id: comisionId, rate: tasa, status: estatus, paymentDate: fecha_pago },
      });
      return `Comisión #${data.id}: tasa ${data.rate}%, ${data.status}${data.paymentDate ? `, pago ${data.paymentDate}` : ""}`;
    },
  }),
  definir({
    nombre: "crear_prospecto",
    descripcion: "Da de alta un prospecto en el CRM, opcionalmente con seguimientos iniciales.",
    rutas: ["/crm"],
    esquema: z.object({ ...camposProspecto, etapa: z.enum(ETAPAS).optional(), seguimientos: z.array(seguimiento).optional() }),
    previsualizar: async (entrada) => `Nuevo prospecto: ${entrada.nombre_prospecto} (${entrada.nombre_negocio}), ${entrada.zona}, asesor ${entrada.asesor}`,
    ejecutar: async ({ seguimientos, ...entrada }) => {
      const data = await invocar(postProspecto, "/api/v1/crm/prospectos", {
        metodo: "POST",
        cuerpo: { ...prospectoParaApi(entrada), seguimientos: seguimientos?.map(seguimientoParaApi) },
      });
      return `Prospecto #${data.id} creado`;
    },
  }),
  definir({
    nombre: "actualizar_prospecto",
    descripcion: "Modifica datos o etapa de un prospecto. Envía solo los campos que cambian.",
    rutas: ["/crm"],
    esquema: z.object({ id, ...z.object(camposProspecto).partial().shape }),
    previsualizar: async ({ id: prospectoId, ...cambios }) => {
      const actual = await exigirFila("crm_prospectos", prospectoId, "el prospecto");
      return `Prospecto #${prospectoId} ${actual.nombre_prospecto}: ${diferencias(actual, cambios)}`;
    },
    ejecutar: async ({ id: prospectoId, ...cambios }) => {
      await invocar(patchProspecto, `/api/v1/crm/prospectos/${prospectoId}`, {
        metodo: "PATCH",
        cuerpo: prospectoParaApi(cambios),
        params: { id: String(prospectoId) },
      });
      return `Prospecto #${prospectoId} actualizado`;
    },
  }),
  definir({
    nombre: "eliminar_prospecto",
    descripcion: "Elimina definitivamente un prospecto y todos sus seguimientos.",
    rutas: ["/crm"],
    esquema: z.object({ id }),
    previsualizar: async ({ id: prospectoId }) => {
      const actual = await exigirFila("crm_prospectos", prospectoId, "el prospecto");
      return `ELIMINAR prospecto #${prospectoId} ${actual.nombre_prospecto} (${actual.nombre_negocio}) y sus seguimientos`;
    },
    ejecutar: async ({ id: prospectoId }) => {
      await invocar(deleteProspecto, `/api/v1/crm/prospectos/${prospectoId}`, { metodo: "DELETE", params: { id: String(prospectoId) } });
      return `Prospecto #${prospectoId} eliminado`;
    },
  }),
  definir({
    nombre: "agregar_seguimiento",
    descripcion: "Registra un seguimiento en un prospecto.",
    rutas: ["/crm"],
    esquema: seguimiento.extend({ prospecto_id: id }),
    previsualizar: async ({ prospecto_id, tipo, comentario }) => {
      const actual = await exigirFila("crm_prospectos", prospecto_id, "el prospecto");
      return `Seguimiento (${tipo}) en prospecto #${prospecto_id} ${actual.nombre_prospecto}: ${comentario}`;
    },
    ejecutar: async ({ prospecto_id, ...entrada }) => {
      const data = await invocar(postSeguimiento, `/api/v1/crm/prospectos/${prospecto_id}/seguimientos`, {
        metodo: "POST",
        cuerpo: seguimientoParaApi(entrada),
        params: { id: String(prospecto_id) },
      });
      return `Seguimiento #${data.id} registrado`;
    },
  }),
  definir({
    nombre: "eliminar_seguimiento",
    descripcion: "Elimina definitivamente un seguimiento de un prospecto.",
    rutas: ["/crm"],
    esquema: z.object({ prospecto_id: id, seguimiento_id: id }),
    previsualizar: async ({ prospecto_id, seguimiento_id }) => {
      const actual = await exigirFila("crm_seguimientos", seguimiento_id, "el seguimiento");
      if (actual.prospecto_id !== prospecto_id) throw new Error(`El seguimiento ${seguimiento_id} no pertenece al prospecto ${prospecto_id}`);
      return `ELIMINAR seguimiento #${seguimiento_id} (${actual.tipo}, ${actual.fecha}) del prospecto #${prospecto_id}`;
    },
    ejecutar: async ({ prospecto_id, seguimiento_id }) => {
      await invocar(deleteSeguimiento, `/api/v1/crm/prospectos/${prospecto_id}/seguimientos?segId=${seguimiento_id}`, {
        metodo: "DELETE",
        params: { id: String(prospecto_id) },
      });
      return `Seguimiento #${seguimiento_id} eliminado`;
    },
  }),
  definir({
    nombre: "crear_pedido",
    descripcion: "Captura un pedido. Se le agrega 16% de IVA. Usa ids de los módulos clientes y productos_venta.",
    rutas: ["/ventas"],
    esquema: z.object({
      cliente_id: id,
      items: z.array(z.object({ producto_id: id, cajas: z.number().positive(), precio_unitario: z.number().min(0) })).min(1),
      fecha_compromiso: fecha.optional(),
      comentarios: z.string().optional(),
    }),
    previsualizar: async ({ cliente_id, items, fecha_compromiso }) => {
      const cliente = await exigirFila("clientes", cliente_id, "el cliente", "nombre_comercial");
      const partidas = await Promise.all(items.map(async (item) => {
        const producto = await exigirFila("productos", item.producto_id, "el producto", "sku, nombre");
        return `${item.cajas} × ${producto.sku} ${producto.nombre} a ${dinero(item.precio_unitario)}`;
      }));
      const subtotal = items.reduce((suma, item) => suma + item.cajas * item.precio_unitario, 0);
      return `Pedido para ${cliente.nombre_comercial}${fecha_compromiso ? `, compromiso ${fecha_compromiso}` : ""}: ${partidas.join(", ")}. Total con IVA ${dinero(subtotal * 1.16)}`;
    },
    ejecutar: async ({ cliente_id, items, fecha_compromiso, comentarios }) => {
      const data = await invocar(postPedido, "/api/v1/ventas/pedidos", {
        metodo: "POST",
        cuerpo: {
          clienteId: cliente_id,
          fechaCompromiso: fecha_compromiso,
          comentarios,
          items: items.map((item) => ({ productoId: item.producto_id, cantidad: item.cajas, precioUnitario: item.precio_unitario })),
        },
      });
      return `Pedido #${data.id} creado, total ${dinero(data.total)}`;
    },
  }),
  definir({
    nombre: "registrar_movimiento_inventario",
    descripcion: "Registra un movimiento en el Centro de Inventarios para un código del corte físico.",
    rutas: ["/inventarios/reporte"],
    esquema: z.object({
      fecha,
      tipo: z.enum(["Entrada", "Salida", "Transferencia", "Ajuste"]),
      codigo: texto,
      unidades: z.number().refine((valor) => valor !== 0, "Las unidades no pueden ser cero"),
      referencia: texto,
    }),
    previsualizar: async ({ fecha: dia, tipo, codigo, unidades, referencia }) => {
      const producto = inventorySnapshotProducts().find((item) => item.code === codigo);
      if (!producto) throw new Error(`El código ${codigo} no está en el corte físico`);
      return `${tipo} de ${unidades} u. de ${codigo} ${producto.product} en ${producto.warehouse} (${dia}), ref. ${referencia}`;
    },
    ejecutar: async ({ fecha: dia, tipo, codigo, unidades, referencia }) => {
      const data = await invocar(postMovimiento, "/api/v1/inventarios/reporte", {
        metodo: "POST",
        cuerpo: { date: dia, type: tipo, code: codigo, units: unidades, reference: referencia },
      });
      return `Movimiento #${data.id} registrado`;
    },
  }),
  definir({
    nombre: "actualizar_caducidad",
    descripcion: "Cambia la caducidad de un producto en la tabla de inventario. El Centro de Inventarios muestra el corte físico, que no incluye caducidades, así que el cambio puede no verse ahí.",
    rutas: ["/inventarios/reporte"],
    esquema: z.object({ codigo: texto, caducidad: fecha }),
    previsualizar: async ({ codigo, caducidad }) => {
      const actual = await fila("inventario_reporte_productos", "code", codigo, "code, product, expiry");
      if (!actual) throw new Error(`El código ${codigo} no está en la tabla editable de inventario`);
      return `Caducidad de ${codigo} ${actual.product}: ${actual.expiry ?? "—"} → ${caducidad}`;
    },
    ejecutar: async ({ codigo, caducidad }) => {
      await invocar(patchCaducidad, "/api/v1/inventarios/reporte", { metodo: "PATCH", cuerpo: { code: codigo, expiry: caducidad } });
      return `Caducidad de ${codigo} guardada en ${caducidad}. El Centro de Inventarios seguirá mostrando el corte físico.`;
    },
  }),
  definir({
    nombre: "registrar_movimiento_kardex",
    descripcion: "Registra entrada, salida, transferencia o ajuste en el kardex. Toma los ids de catalogos_operacion.",
    rutas: ["/inventarios"],
    esquema: z.object({
      tipo: z.enum(["entrada", "salida", "transferencia", "ajuste"]),
      producto_id: id,
      cantidad: z.number().positive(),
      unidad_id: id,
      usuario_id: id,
      lote_id: id.optional(),
      almacen_origen_id: id.optional(),
      almacen_destino_id: id.optional(),
      motivo: z.string().optional(),
      fecha: fecha.optional(),
    }),
    previsualizar: async ({ tipo, producto_id, cantidad, unidad_id, usuario_id, motivo }) => {
      const [producto, unidad] = await Promise.all([
        exigirFila("productos", producto_id, "el producto", "sku, nombre"),
        exigirFila("unidades_medida", unidad_id, "la unidad de medida", "nombre"),
        exigirFila("usuarios", usuario_id, "el usuario", "id"),
      ]);
      return `Kardex: ${tipo} de ${cantidad} ${unidad.nombre} de ${producto.sku} ${producto.nombre}${motivo ? `, motivo: ${motivo}` : ""}`;
    },
    ejecutar: async (entrada) => {
      const data = await invocar(postKardex, "/api/v1/inventarios/movimientos", {
        metodo: "POST",
        cuerpo: {
          tipoMovimiento: entrada.tipo,
          productoId: entrada.producto_id,
          cantidad: entrada.cantidad,
          unidad: entrada.unidad_id,
          userId: entrada.usuario_id,
          loteId: entrada.lote_id,
          almacenOrigenId: entrada.almacen_origen_id,
          almacenDestinoId: entrada.almacen_destino_id,
          motivo: entrada.motivo,
          fecha: entrada.fecha,
        },
      });
      return `Movimiento de kardex #${data.id} registrado`;
    },
  }),
  definir({
    nombre: "programar_envio",
    descripcion: "Programa el envío de un pedido.",
    rutas: ["/logistica"],
    esquema: z.object({
      pedido_id: id,
      ruta_id: id.optional(),
      operador_id: id.optional(),
      unidad_id: id.optional().describe("Vehículo"),
      fecha_salida: fecha.optional(),
    }),
    previsualizar: async ({ pedido_id, fecha_salida }) => {
      const pedido = await exigirFila("ventas_pedidos", pedido_id, "el pedido", "folio");
      return `Programar envío del pedido #${pedido_id} (${pedido.folio})${fecha_salida ? `, salida ${fecha_salida}` : ""}`;
    },
    ejecutar: async ({ pedido_id, ruta_id, operador_id, unidad_id, fecha_salida }) => {
      const data = await invocar(postEnvio, "/api/v1/logistica/envios", {
        metodo: "POST",
        cuerpo: { pedidoId: pedido_id, rutaId: ruta_id, operadorId: operador_id, unidadId: unidad_id, fechaSalida: fecha_salida },
      });
      return `Envío #${data.id} programado`;
    },
  }),
  definir({
    nombre: "actualizar_estatus_envio",
    descripcion: "Cambia el estatus de un envío.",
    rutas: ["/logistica"],
    esquema: z.object({ envio_id: id, estatus: z.enum(["programado", "en_ruta", "enviado", "entregado", "devuelto"]) }),
    previsualizar: async ({ envio_id, estatus }) => {
      const actual = await exigirFila("logistica_envios", envio_id, "el envío", "estatus, pedido_id");
      return `Envío #${envio_id} (pedido #${actual.pedido_id}): ${actual.estatus} → ${estatus}`;
    },
    ejecutar: async ({ envio_id, estatus }) => {
      const data = await invocar(patchEnvioEstatus, `/api/v1/logistica/envios/${envio_id}/estatus`, {
        metodo: "PATCH",
        cuerpo: { estatus },
        params: { envioId: String(envio_id) },
      });
      return `Envío #${data.id} ahora está ${data.estatus}`;
    },
  }),
  definir({
    nombre: "registrar_produccion",
    descripcion: "Registra una captura de producción. Toma los ids de catalogos_operacion.",
    rutas: ["/produccion"],
    esquema: z.object({
      orden_id: id,
      usuario_id: id,
      area_id: id,
      turno: z.enum(["Matutino", "Vespertino", "Nocturno"]),
      kg_procesado: z.number().min(0),
      kg_merma: z.number().min(0),
      minutos_paro: z.number().int().min(0),
      incidencia: z.string().optional(),
    }),
    previsualizar: async ({ orden_id, area_id, turno, kg_procesado, kg_merma, minutos_paro }) => {
      const [, area] = await Promise.all([
        exigirFila("produccion_ordenes", orden_id, "la orden", "id"),
        exigirFila("areas", area_id, "el área", "nombre"),
      ]);
      return `Producción orden #${orden_id}, ${area.nombre}, turno ${turno}: ${kg_procesado} kg procesados, ${kg_merma} kg de merma, ${minutos_paro} min de paro`;
    },
    ejecutar: async (entrada) => {
      const data = await invocar(postProduccion, "/api/v1/produccion/capturas", {
        metodo: "POST",
        cuerpo: {
          ordenId: entrada.orden_id,
          userId: entrada.usuario_id,
          areaId: entrada.area_id,
          turno: entrada.turno,
          kgProcesado: entrada.kg_procesado,
          kgMerma: entrada.kg_merma,
          minutosParo: entrada.minutos_paro,
          incidencia: entrada.incidencia,
        },
      });
      return `Captura de producción #${data.id} registrada`;
    },
  }),
  definir({
    nombre: "actualizar_producto",
    descripcion: "Cambia datos del producto, precios por lista o modelo de costeo. Envía solo lo que cambia; consulta antes el módulo costeo.",
    rutas: ["/costeo"],
    esquema: actualizarProducto,
    previsualizar: async (entrada) => {
      const { actual, borrador } = await productoConCambios(entrada);
      const partes = [
        diferencias(actual, entrada.producto ?? {}),
        diferencias(actual.costModel, entrada.costeo ?? {}),
        ...(entrada.precios ?? []).map((cambio) => {
          const precio = (actual.prices as Respuesta[]).find((item) => item.id === cambio.id);
          return `${precio?.mode} ${precio?.range}: ${dinero(Number(precio?.price))} → ${dinero(cambio.precio)}`;
        }),
      ].filter(Boolean);
      return `Producto ${entrada.codigo} ${actual.product}: ${partes.join("; ")}`;
    },
    ejecutar: async (entrada) => {
      const { borrador } = await productoConCambios(entrada);
      await invocar(patchProducto, "/api/v1/productos", { metodo: "PATCH", cuerpo: borrador });
      return `Producto ${entrada.codigo} actualizado`;
    },
  }),
];

/* ---------- Puente con Claude ---------- */

const esquemaConsulta = z.object({
  modulo: z.enum(Object.keys(MODULOS) as [NombreModulo, ...NombreModulo[]]),
  buscar: z.string().optional().describe("Palabras a buscar en los registros; todas deben aparecer"),
  limite: z.number().int().min(1).max(LIMITE_FILAS).optional(),
});

/** Herramientas permitidas al perfil. Las de escritura solo acumulan en `propuestas`. */
export function herramientasPara(perfil: ProfileId, propuestas: OperacionPropuesta[]) {
  const modulos = (Object.entries(MODULOS) as Array<[NombreModulo, Modulo]>).filter(([, modulo]) => puedeAcceder(perfil, modulo.rutas));
  const consultar = betaZodTool({
    name: "consultar",
    description: `Lee datos del sistema. Módulos disponibles:\n${modulos.map(([nombre, modulo]) => `- ${nombre}: ${modulo.descripcion}`).join("\n")}`,
    inputSchema: esquemaConsulta,
    run: async ({ modulo, buscar, limite }) => {
      if (!modulos.some(([nombre]) => nombre === modulo)) throw new Error(`El perfil no tiene acceso al módulo ${modulo}`);
      return consultarModulo(modulo, buscar, limite);
    },
  });

  const escrituras = OPERACIONES.filter((operacion) => puedeAcceder(perfil, operacion.rutas)).map((operacion) =>
    betaZodTool({
      name: operacion.nombre,
      description: `${operacion.descripcion} Queda pendiente hasta que el usuario lo confirme.`,
      inputSchema: operacion.esquema,
      run: async (entrada) => {
        const resumen = await operacion.previsualizar(entrada);
        propuestas.push({ herramienta: operacion.nombre, entrada, resumen });
        return `Propuesto, aún SIN aplicar: ${resumen}`;
      },
    }),
  );

  return [consultar, ...escrituras];
}

/** Aplica una tarjeta confirmada en orden y se detiene en el primer fallo. */
export async function ejecutarOperaciones(perfil: ProfileId, operaciones: OperacionPropuesta[]) {
  const resultados: ResultadoOperacion[] = [];
  let fallo = false;
  for (const { herramienta, entrada, resumen } of operaciones) {
    if (fallo) {
      resultados.push({ resumen, ok: false, detalle: "No se aplicó porque falló un paso anterior" });
      continue;
    }
    try {
      const operacion = OPERACIONES.find((item) => item.nombre === herramienta);
      if (!operacion || !puedeAcceder(perfil, operacion.rutas)) throw new Error("Tu perfil no permite esta operación");
      const detalle = await operacion.ejecutar(operacion.esquema.parse(entrada));
      resultados.push({ resumen, ok: true, detalle });
    } catch (error) {
      fallo = true;
      resultados.push({ resumen, ok: false, detalle: error instanceof Error ? error.message : "Error desconocido" });
    }
  }
  return resultados;
}
