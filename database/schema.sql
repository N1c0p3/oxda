-- Papas Demo - Esquema inicial PostgreSQL

-- =========================
-- Seguridad y organización
-- =========================

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE areas (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    apellidos VARCHAR(120),
    email VARCHAR(180) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    area_id BIGINT REFERENCES areas(id),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios_roles (
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    rol_id BIGINT NOT NULL REFERENCES roles(id),
    PRIMARY KEY (usuario_id, rol_id)
);

-- =========================
-- Catálogos
-- =========================

CREATE TABLE unidades_medida (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(60) NOT NULL
);

CREATE TABLE productos (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(60) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(40) NOT NULL, -- materia_prima, proceso, terminado
    unidad_id BIGINT NOT NULL REFERENCES unidades_medida(id),
    costo_estandar NUMERIC(14,4) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE almacenes (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    tipo VARCHAR(40) NOT NULL, -- materia_prima, proceso, terminado, devoluciones
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE proveedores (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    rfc VARCHAR(30),
    telefono VARCHAR(30),
    email VARCHAR(180),
    estatus VARCHAR(30) NOT NULL DEFAULT 'activo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clientes (
    id BIGSERIAL PRIMARY KEY,
    nombre_comercial VARCHAR(160) NOT NULL,
    razon_social VARCHAR(200),
    rfc VARCHAR(30),
    segmento VARCHAR(40),
    limite_credito NUMERIC(14,2) NOT NULL DEFAULT 0,
    dias_credito INT NOT NULL DEFAULT 0,
    estatus VARCHAR(30) NOT NULL DEFAULT 'activo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE contactos_cliente (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id),
    nombre VARCHAR(120) NOT NULL,
    puesto VARCHAR(120),
    telefono VARCHAR(30),
    email VARCHAR(180)
);

-- =========================
-- Inventario y trazabilidad
-- =========================

CREATE TABLE lotes (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(80) UNIQUE NOT NULL,
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    fecha_produccion DATE,
    fecha_caducidad DATE,
    estatus VARCHAR(30) NOT NULL DEFAULT 'activo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventario_existencia (
    id BIGSERIAL PRIMARY KEY,
    almacen_id BIGINT NOT NULL REFERENCES almacenes(id),
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    lote_id BIGINT REFERENCES lotes(id),
    cantidad NUMERIC(14,3) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (almacen_id, producto_id, lote_id)
);

CREATE TABLE inventario_movimientos (
    id BIGSERIAL PRIMARY KEY,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tipo_movimiento VARCHAR(40) NOT NULL, -- entrada, salida, transferencia, ajuste
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    lote_id BIGINT REFERENCES lotes(id),
    almacen_origen_id BIGINT REFERENCES almacenes(id),
    almacen_destino_id BIGINT REFERENCES almacenes(id),
    cantidad NUMERIC(14,3) NOT NULL,
    unidad_id BIGINT NOT NULL REFERENCES unidades_medida(id),
    motivo VARCHAR(200),
    referencia_tipo VARCHAR(60),
    referencia_id BIGINT,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id)
);

-- =========================
-- Producción
-- =========================

CREATE TABLE produccion_planes (
    id BIGSERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    turno VARCHAR(30) NOT NULL,
    area_id BIGINT NOT NULL REFERENCES areas(id),
    meta_kg NUMERIC(14,3) NOT NULL,
    supervisor_id BIGINT NOT NULL REFERENCES usuarios(id),
    estatus VARCHAR(30) NOT NULL DEFAULT 'abierto',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE produccion_ordenes (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL REFERENCES produccion_planes(id),
    lote_id BIGINT NOT NULL REFERENCES lotes(id),
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    objetivo_kg NUMERIC(14,3) NOT NULL,
    kg_producido NUMERIC(14,3) NOT NULL DEFAULT 0,
    kg_merma NUMERIC(14,3) NOT NULL DEFAULT 0,
    estatus VARCHAR(30) NOT NULL DEFAULT 'abierta',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE produccion_capturas (
    id BIGSERIAL PRIMARY KEY,
    orden_id BIGINT NOT NULL REFERENCES produccion_ordenes(id),
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    area_id BIGINT NOT NULL REFERENCES areas(id),
    turno VARCHAR(30) NOT NULL,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    kg_procesado NUMERIC(14,3) NOT NULL DEFAULT 0,
    kg_merma NUMERIC(14,3) NOT NULL DEFAULT 0,
    minutos_paro INT NOT NULL DEFAULT 0,
    incidencia TEXT
);

-- =========================
-- Compras
-- =========================

CREATE TABLE compras_ordenes (
    id BIGSERIAL PRIMARY KEY,
    folio VARCHAR(80) UNIQUE NOT NULL,
    proveedor_id BIGINT NOT NULL REFERENCES proveedores(id),
    fecha DATE NOT NULL,
    estatus VARCHAR(30) NOT NULL DEFAULT 'abierta',
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE compras_ordenes_detalle (
    id BIGSERIAL PRIMARY KEY,
    orden_compra_id BIGINT NOT NULL REFERENCES compras_ordenes(id),
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(14,3) NOT NULL,
    precio_unitario NUMERIC(14,4) NOT NULL,
    subtotal NUMERIC(14,2) NOT NULL
);

-- =========================
-- CRM y ventas
-- =========================

CREATE TABLE crm_oportunidades (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id),
    nombre VARCHAR(160) NOT NULL,
    etapa VARCHAR(40) NOT NULL,
    probabilidad NUMERIC(5,2) NOT NULL DEFAULT 0,
    monto_estimado NUMERIC(14,2) NOT NULL DEFAULT 0,
    fecha_cierre_estimada DATE,
    responsable_id BIGINT NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ventas_pedidos (
    id BIGSERIAL PRIMARY KEY,
    folio VARCHAR(80) UNIQUE NOT NULL,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id),
    fecha_pedido DATE NOT NULL,
    fecha_compromiso DATE,
    estatus VARCHAR(40) NOT NULL DEFAULT 'capturado',
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    impuestos NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ventas_pedidos_detalle (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL REFERENCES ventas_pedidos(id),
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(14,3) NOT NULL,
    precio_unitario NUMERIC(14,4) NOT NULL,
    subtotal NUMERIC(14,2) NOT NULL
);

CREATE TABLE cobranza_movimientos (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id),
    pedido_id BIGINT REFERENCES ventas_pedidos(id),
    fecha_pago DATE NOT NULL,
    monto NUMERIC(14,2) NOT NULL,
    referencia VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Logística
-- =========================

CREATE TABLE logistica_rutas (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    zona VARCHAR(80)
);

CREATE TABLE logistica_unidades (
    id BIGSERIAL PRIMARY KEY,
    placa VARCHAR(30) UNIQUE NOT NULL,
    tipo VARCHAR(60),
    capacidad_kg NUMERIC(14,3) NOT NULL DEFAULT 0,
    estatus VARCHAR(30) NOT NULL DEFAULT 'activa'
);

CREATE TABLE logistica_envios (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL REFERENCES ventas_pedidos(id),
    ruta_id BIGINT REFERENCES logistica_rutas(id),
    unidad_id BIGINT REFERENCES logistica_unidades(id),
    operador_id BIGINT REFERENCES usuarios(id),
    fecha_salida TIMESTAMPTZ,
    fecha_entrega TIMESTAMPTZ,
    estatus VARCHAR(40) NOT NULL DEFAULT 'programado',
    evidencia_url TEXT,
    recibido_por VARCHAR(120),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Alertas y KPIs
-- =========================

CREATE TABLE alertas (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(60) NOT NULL,
    severidad VARCHAR(20) NOT NULL,
    mensaje TEXT NOT NULL,
    entidad_tipo VARCHAR(60),
    entidad_id BIGINT,
    atendida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atendida_at TIMESTAMPTZ,
    atendida_por BIGINT REFERENCES usuarios(id)
);

CREATE INDEX idx_mov_fecha ON inventario_movimientos(fecha);
CREATE INDEX idx_capturas_fecha ON produccion_capturas(fecha_hora);
CREATE INDEX idx_pedidos_fecha ON ventas_pedidos(fecha_pedido);
CREATE INDEX idx_alertas_estado ON alertas(atendida, severidad);
