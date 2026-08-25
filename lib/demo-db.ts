// OXDA Sistema de Gestión - Datos Mayo 2026

export type ProduccionCaptura = {
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

export type InventarioMovimiento = {
  id: number;
  fecha: string;
  tipoMovimiento: "entrada" | "salida" | "transferencia" | "ajuste";
  productoId: number;
  productoNombre?: string;
  loteId?: string;
  almacenOrigenId?: number;
  almacenDestinoId?: number;
  cantidad: number;
  unidad: string;
  motivo?: string;
  userId: number;
  costoUnitario?: number;
};

export type ProductoInventario = {
  id: number;
  sku: string;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  unidad: string;
  costoPromedio: number;
  precioVenta: number;
  almacenId: number;
  proveedor?: string;
};

export type Oportunidad = {
  id: number;
  clienteId: number;
  nombre: string;
  etapa: "prospecto" | "calificado" | "propuesta" | "negociacion" | "ganado" | "perdido";
  probabilidad: number;
  montoEstimado: number;
  cierreEstimado?: string;
  createdAt: string;
  vendedorId?: number;
};

export type PedidoItem = {
  productoId: number;
  productoNombre?: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
};

export type Pedido = {
  id: number;
  clienteId: number;
  clienteNombre?: string;
  fechaCompromiso?: string;
  items: PedidoItem[];
  comentarios?: string;
  subtotal: number;
  descuento?: number;
  impuestos: number;
  total: number;
  estatus: "pendiente" | "en_proceso" | "en_ruta" | "entregado" | "cancelado";
  metodoPago?: string;
  vendedorId?: number;
  createdAt: string;
};

export type Envio = {
  id: number;
  pedidoId: number;
  clienteNombre?: string;
  fechaSalida?: string;
  fechaEntrega?: string;
  rutaId?: number;
  rutaNombre?: string;
  operadorId?: number;
  operadorNombre?: string;
  unidadId?: number;
  unidadPlacas?: string;
  estatus: "programado" | "en_ruta" | "entregado" | "cancelado";
  createdAt: string;
  updatedAt?: string;
};

export type VentaDiaria = {
  fecha: string;
  totalVentas: number;
  totalPedidos: number;
  totalClientes: number;
  ticketPromedio: number;
  productoTop: string;
};

export type InventarioResumen = {
  almacenId: number;
  almacenNombre: string;
  totalProductos: number;
  valorTotal: number;
  stockBajo: number;
  rotacion: number;
};

/* ─── Demo seed data ──────────────────────────────────────────────────────── */
const seedCapturas: ProduccionCaptura[] = [
  { id:1,  ordenId:1, userId:1, areaId:1, turno:"matutino",  kgProcesado:1250, kgMerma:62,  minutosParo:10, incidencia:"",            fechaHora:"2026-04-28T07:20:00Z" },
  { id:2,  ordenId:1, userId:2, areaId:2, turno:"matutino",  kgProcesado:980,  kgMerma:49,  minutosParo:0,  incidencia:"",            fechaHora:"2026-04-28T08:10:00Z" },
  { id:3,  ordenId:2, userId:3, areaId:3, turno:"vespertino",kgProcesado:1420, kgMerma:85,  minutosParo:20, incidencia:"Banda lenta",  fechaHora:"2026-04-28T15:00:00Z" },
  { id:4,  ordenId:2, userId:4, areaId:4, turno:"vespertino",kgProcesado:870,  kgMerma:35,  minutosParo:0,  incidencia:"",            fechaHora:"2026-04-28T16:30:00Z" },
  { id:5,  ordenId:3, userId:1, areaId:5, turno:"nocturno",  kgProcesado:600,  kgMerma:24,  minutosParo:5,  incidencia:"",            fechaHora:"2026-04-28T22:00:00Z" },
  { id:6,  ordenId:3, userId:2, areaId:1, turno:"matutino",  kgProcesado:1340, kgMerma:67,  minutosParo:0,  incidencia:"",            fechaHora:"2026-04-29T07:15:00Z" },
  { id:7,  ordenId:4, userId:3, areaId:2, turno:"matutino",  kgProcesado:1100, kgMerma:55,  minutosParo:15, incidencia:"Falla sensor",fechaHora:"2026-04-29T08:40:00Z" },
  { id:8,  ordenId:4, userId:4, areaId:3, turno:"vespertino",kgProcesado:1520, kgMerma:76,  minutosParo:0,  incidencia:"",            fechaHora:"2026-04-29T14:50:00Z" },
  { id:9,  ordenId:5, userId:5, areaId:4, turno:"vespertino",kgProcesado:760,  kgMerma:30,  minutosParo:0,  incidencia:"",            fechaHora:"2026-04-29T16:00:00Z" },
  { id:10, ordenId:5, userId:1, areaId:5, turno:"nocturno",  kgProcesado:580,  kgMerma:28,  minutosParo:10, incidencia:"",            fechaHora:"2026-04-29T21:30:00Z" },
  { id:11, ordenId:6, userId:2, areaId:1, turno:"matutino",  kgProcesado:1380, kgMerma:69,  minutosParo:0,  incidencia:"",            fechaHora:"2026-04-30T07:00:00Z" },
  { id:12, ordenId:6, userId:3, areaId:2, turno:"matutino",  kgProcesado:1050, kgMerma:52,  minutosParo:5,  incidencia:"",            fechaHora:"2026-04-30T08:20:00Z" },
  { id:13, ordenId:7, userId:4, areaId:3, turno:"vespertino",kgProcesado:1490, kgMerma:90,  minutosParo:30, incidencia:"Paro maq.",   fechaHora:"2026-04-30T15:10:00Z" },
  { id:14, ordenId:7, userId:5, areaId:4, turno:"vespertino",kgProcesado:820,  kgMerma:33,  minutosParo:0,  incidencia:"",            fechaHora:"2026-04-30T16:45:00Z" },
  { id:15, ordenId:8, userId:1, areaId:5, turno:"nocturno",  kgProcesado:640,  kgMerma:25,  minutosParo:0,  incidencia:"",            fechaHora:"2026-04-30T22:10:00Z" },
  { id:16, ordenId:8, userId:2, areaId:1, turno:"matutino",  kgProcesado:1290, kgMerma:64,  minutosParo:0,  incidencia:"",            fechaHora:"2026-05-01T07:05:00Z" },
  { id:17, ordenId:9, userId:3, areaId:2, turno:"matutino",  kgProcesado:960,  kgMerma:48,  minutosParo:10, incidencia:"",            fechaHora:"2026-05-01T08:30:00Z" },
  { id:18, ordenId:9, userId:4, areaId:3, turno:"vespertino",kgProcesado:1380, kgMerma:69,  minutosParo:0,  incidencia:"",            fechaHora:"2026-05-01T14:40:00Z" },
  { id:19, ordenId:10,userId:5, areaId:4, turno:"nocturno",  kgProcesado:720,  kgMerma:29,  minutosParo:0,  incidencia:"",            fechaHora:"2026-05-01T22:00:00Z" },
  { id:20, ordenId:10,userId:1, areaId:5, turno:"nocturno",  kgProcesado:555,  kgMerma:22,  minutosParo:5,  incidencia:"",            fechaHora:"2026-05-02T22:30:00Z" },
];

const AREA_NAMES: Record<number,string> = { 1:"Lavado", 2:"Pelado", 3:"Corte", 4:"Fritura", 5:"Empaque" };

const seedMovimientos: InventarioMovimiento[] = [
  { id:1,  fecha:"2026-04-28", tipoMovimiento:"entrada",      productoId:1, loteId:"1", almacenOrigenId:undefined, almacenDestinoId:1, cantidad:5000, unidad:"kg", motivo:"Recepción de campo", userId:1 },
  { id:2,  fecha:"2026-04-28", tipoMovimiento:"salida",       productoId:1, loteId:"1", almacenOrigenId:1, almacenDestinoId:undefined, cantidad:1250, unidad:"kg", motivo:"Producción orden 1", userId:1 },
  { id:3,  fecha:"2026-04-29", tipoMovimiento:"entrada",      productoId:2, loteId:"2", almacenOrigenId:undefined, almacenDestinoId:2, cantidad:200,  unidad:"bolsas", motivo:"Reabasto empaque", userId:2 },
  { id:4,  fecha:"2026-04-29", tipoMovimiento:"transferencia",productoId:1, loteId:"1", almacenOrigenId:1, almacenDestinoId:3, cantidad:800,  unidad:"kg", motivo:"Traslado a fritura", userId:3 },
  { id:5,  fecha:"2026-04-30", tipoMovimiento:"salida",       productoId:2, loteId:"2", almacenOrigenId:2, almacenDestinoId:undefined, cantidad:120,  unidad:"bolsas", motivo:"Pedido #3", userId:2 },
  { id:6,  fecha:"2026-04-30", tipoMovimiento:"entrada",      productoId:3, loteId:"3", almacenOrigenId:undefined, almacenDestinoId:1, cantidad:3500, unidad:"kg", motivo:"Compra proveedor", userId:1 },
  { id:7,  fecha:"2026-04-30", tipoMovimiento:"ajuste",       productoId:1, loteId:"1", almacenOrigenId:1, almacenDestinoId:undefined, cantidad:50,   unidad:"kg", motivo:"Merma descubierta", userId:4 },
  { id:8,  fecha:"2026-05-01", tipoMovimiento:"entrada",      productoId:1, loteId:"4", almacenOrigenId:undefined, almacenDestinoId:1, cantidad:4200, unidad:"kg", motivo:"Recepción de campo", userId:1 },
  { id:9,  fecha:"2026-05-01", tipoMovimiento:"salida",       productoId:1, loteId:"4", almacenOrigenId:1, almacenDestinoId:undefined, cantidad:1800, unidad:"kg", motivo:"Producción orden 5", userId:2 },
  { id:10, fecha:"2026-05-02", tipoMovimiento:"transferencia",productoId:3, loteId:"3", almacenOrigenId:1, almacenDestinoId:3, cantidad:600,  unidad:"kg", motivo:"Traslado a empaque", userId:3 },
  { id:11, fecha:"2026-05-02", tipoMovimiento:"salida",       productoId:3, loteId:"3", almacenOrigenId:3, almacenDestinoId:undefined, cantidad:350,  unidad:"kg", motivo:"Pedido #7", userId:1 },
  { id:12, fecha:"2026-05-03", tipoMovimiento:"entrada",      productoId:2, loteId:"5", almacenOrigenId:undefined, almacenDestinoId:2, cantidad:500,  unidad:"bolsas", motivo:"Compra urgente", userId:5 },
];

const seedOportunidades: Oportunidad[] = [
  { id:1,  clienteId:101, nombre:"Cadena Supermercados Norte",    etapa:"propuesta",    probabilidad:70, montoEstimado:180000, cierreEstimado:"2026-05-20", createdAt:"2026-04-01T09:00:00Z" },
  { id:2,  clienteId:102, nombre:"Restaurantes El Sabor",         etapa:"negociacion",  probabilidad:60, montoEstimado:95000,  cierreEstimado:"2026-05-15", createdAt:"2026-04-05T10:30:00Z" },
  { id:3,  clienteId:103, nombre:"Distribuidora Pacífico",        etapa:"ganado",       probabilidad:100,montoEstimado:250000, cierreEstimado:"2026-04-30", createdAt:"2026-03-20T08:00:00Z" },
  { id:4,  clienteId:104, nombre:"Tiendas de Conveniencia Rápido",etapa:"prospecto",    probabilidad:30, montoEstimado:60000,  cierreEstimado:"2026-06-01", createdAt:"2026-04-10T11:00:00Z" },
  { id:5,  clienteId:105, nombre:"Hotel Grand Plaza",             etapa:"calificado",   probabilidad:50, montoEstimado:40000,  cierreEstimado:"2026-05-25", createdAt:"2026-04-12T14:00:00Z" },
  { id:6,  clienteId:106, nombre:"Frituras Premium S.A.",         etapa:"ganado",       probabilidad:100,montoEstimado:320000, cierreEstimado:"2026-04-25", createdAt:"2026-03-15T09:30:00Z" },
  { id:7,  clienteId:107, nombre:"Comisariato Federal",           etapa:"perdido",      probabilidad:0,  montoEstimado:75000,  cierreEstimado:"2026-04-20", createdAt:"2026-03-28T13:00:00Z" },
  { id:8,  clienteId:108, nombre:"Snacks del Valle",              etapa:"propuesta",    probabilidad:65, montoEstimado:130000, cierreEstimado:"2026-05-30", createdAt:"2026-04-15T10:00:00Z" },
  { id:9,  clienteId:109, nombre:"Cocinas Industriales Tres",     etapa:"negociacion",  probabilidad:80, montoEstimado:210000, cierreEstimado:"2026-05-10", createdAt:"2026-04-18T08:30:00Z" },
  { id:10, clienteId:110, nombre:"Grupo Alimenticio del Sur",     etapa:"calificado",   probabilidad:45, montoEstimado:90000,  cierreEstimado:"2026-06-15", createdAt:"2026-04-22T09:00:00Z" },
];

const seedPedidos: Pedido[] = [
  { id:1,  clienteId:103, fechaCompromiso:"2026-04-30", items:[{productoId:1,cantidad:500,precioUnitario:28}], comentarios:"Entrega bodega central", subtotal:14000, impuestos:2240,  total:16240,  estatus:"entregado",  createdAt:"2026-04-22T10:00:00Z" },
  { id:2,  clienteId:106, fechaCompromiso:"2026-04-28", items:[{productoId:1,cantidad:800,precioUnitario:27},{productoId:2,cantidad:200,precioUnitario:5}], comentarios:"", subtotal:22600, impuestos:3616,  total:26216,  estatus:"entregado",  createdAt:"2026-04-20T09:00:00Z" },
  { id:3,  clienteId:101, fechaCompromiso:"2026-05-05", items:[{productoId:1,cantidad:1200,precioUnitario:28}], comentarios:"Requiere factura", subtotal:33600, impuestos:5376,  total:38976,  estatus:"en_proceso",  createdAt:"2026-04-28T11:00:00Z" },
  { id:4,  clienteId:102, fechaCompromiso:"2026-05-08", items:[{productoId:2,cantidad:300,precioUnitario:5},{productoId:3,cantidad:150,precioUnitario:32}], comentarios:"", subtotal:6300,  impuestos:1008,  total:7308,   estatus:"pendiente",  createdAt:"2026-04-30T14:00:00Z" },
  { id:5,  clienteId:109, fechaCompromiso:"2026-05-06", items:[{productoId:1,cantidad:900,precioUnitario:29}], comentarios:"Urgente", subtotal:26100, impuestos:4176,  total:30276,  estatus:"en_proceso",  createdAt:"2026-04-30T16:00:00Z" },
  { id:6,  clienteId:105, fechaCompromiso:"2026-05-10", items:[{productoId:3,cantidad:100,precioUnitario:32}], comentarios:"", subtotal:3200,  impuestos:512,   total:3712,   estatus:"pendiente",  createdAt:"2026-05-01T08:00:00Z" },
  { id:7,  clienteId:103, fechaCompromiso:"2026-05-12", items:[{productoId:1,cantidad:600,precioUnitario:28},{productoId:2,cantidad:150,precioUnitario:5}], comentarios:"Segunda entrega del mes", subtotal:17550, impuestos:2808,  total:20358,  estatus:"pendiente",  createdAt:"2026-05-02T10:30:00Z" },
  { id:8,  clienteId:106, fechaCompromiso:"2026-04-25", items:[{productoId:1,cantidad:1500,precioUnitario:27}], comentarios:"Contrato mensual", subtotal:40500, impuestos:6480,  total:46980,  estatus:"entregado",  createdAt:"2026-04-18T09:00:00Z" },
];

const seedEnvios: Envio[] = [
  { id:1, pedidoId:1, fechaSalida:"2026-04-30", rutaId:1, operadorId:1, unidadId:1, estatus:"entregado",   createdAt:"2026-04-29T18:00:00Z", updatedAt:"2026-04-30T14:00:00Z" },
  { id:2, pedidoId:2, fechaSalida:"2026-04-28", rutaId:2, operadorId:2, unidadId:2, estatus:"entregado",   createdAt:"2026-04-27T17:00:00Z", updatedAt:"2026-04-28T12:00:00Z" },
  { id:3, pedidoId:3, fechaSalida:"2026-05-05", rutaId:1, operadorId:1, unidadId:1, estatus:"en_ruta",     createdAt:"2026-05-04T08:00:00Z", updatedAt:"2026-05-04T09:30:00Z" },
  { id:4, pedidoId:4, fechaSalida:"2026-05-08", rutaId:3, operadorId:3, unidadId:3, estatus:"programado",  createdAt:"2026-05-01T10:00:00Z" },
  { id:5, pedidoId:5, fechaSalida:"2026-05-06", rutaId:2, operadorId:2, unidadId:2, estatus:"en_ruta",     createdAt:"2026-05-04T07:00:00Z", updatedAt:"2026-05-04T10:00:00Z" },
  { id:6, pedidoId:6, fechaSalida:"2026-05-10", rutaId:1, operadorId:1, unidadId:1, estatus:"programado",  createdAt:"2026-05-02T08:00:00Z" },
  { id:7, pedidoId:7, fechaSalida:"2026-05-12", rutaId:3, operadorId:3, unidadId:3, estatus:"programado",  createdAt:"2026-05-03T09:00:00Z" },
  { id:8, pedidoId:8, fechaSalida:"2026-04-25", rutaId:2, operadorId:2, unidadId:2, estatus:"entregado",   createdAt:"2026-04-24T16:00:00Z", updatedAt:"2026-04-25T13:00:00Z" },
];

export const db = {
  capturas:     seedCapturas     as ProduccionCaptura[],
  movimientos:  seedMovimientos  as InventarioMovimiento[],
  oportunidades:seedOportunidades as Oportunidad[],
  pedidos:      seedPedidos      as Pedido[],
  envios:       seedEnvios       as Envio[],
  AREA_NAMES,
};
