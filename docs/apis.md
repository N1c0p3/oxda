# Contratos API sugeridos (MVP)

Base URL: /api/v1

## 1) Seguridad y usuarios

### POST /auth/login
- body: { email, password }
- response: { accessToken, user, roles }

### GET /users/me
- response: datos de usuario autenticado

### GET /roles
- response: catálogo de roles

## 2) Catálogos

### GET /areas
### GET /productos
### GET /almacenes
### GET /clientes
### GET /proveedores

## 3) Producción y captura operativa

### POST /produccion/planes
- body: { fecha, turno, areaId, metaKg, supervisorId }

### POST /produccion/ordenes
- body: { planId, loteId, productoId, objetivoKg }

### POST /produccion/capturas
- body:
  {
    ordenId,
    userId,
    areaId,
    turno,
    kgProcesado,
    kgMerma,
    minutosParo,
    incidencia
  }

### GET /produccion/capturas?fecha=&turno=&areaId=
- consulta de productividad por persona/área

## 4) Inventarios y trazabilidad

### POST /inventarios/movimientos
- body:
  {
    fecha,
    tipoMovimiento,
    productoId,
    loteId,
    almacenOrigenId,
    almacenDestinoId,
    cantidad,
    unidad,
    motivo,
    userId
  }

### GET /inventarios/stock?productoId=&almacenId=

### GET /inventarios/kardex?productoId=&desde=&hasta=

### GET /trazabilidad/lotes/{loteId}
- response: historial completo de lote

## 5) Logística

### POST /logistica/envios
- body: { pedidoId, fechaSalida, rutaId, operadorId, unidadId }

### PATCH /logistica/envios/{envioId}/estatus
- body: { estatus }

### POST /logistica/envios/{envioId}/pod
- body: { horaEntrega, recibidoPor, evidenciaUrl, observaciones }

## 6) CRM y ventas

### POST /crm/oportunidades
- body: { clienteId, nombre, etapa, probabilidad, montoEstimado, cierreEstimado }

### PATCH /crm/oportunidades/{id}
- body: actualización de etapa y notas

### POST /ventas/pedidos
- body:
  {
    clienteId,
    fechaCompromiso,
    items: [{ productoId, cantidad, precioUnitario }],
    comentarios
  }

### GET /ventas/pedidos?estatus=&clienteId=

### POST /cobranza/abonos
- body: { clienteId, pedidoId, monto, fechaPago, referencia }

## 7) Dashboard y alertas

### GET /dashboard/kpis?desde=&hasta=
- response:
  {
    kgProcesados,
    mermaPct,
    pedidosOTIF,
    fillRate,
    rotacionInventario,
    carteraVencida
  }

### GET /alertas
- inventario bajo, merma alta, pedido en riesgo, cartera crítica

## 8) Validaciones mínimas

- kgProcesado >= 0
- kgMerma >= 0
- kgMerma <= kgProcesado + tolerancia
- no permitir inventario negativo sin permiso explícito
- usuario debe pertenecer al área de la captura
