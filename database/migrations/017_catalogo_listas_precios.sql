-- Catálogo final y listas de precios del archivo
-- "Lista de precios y catálogo de productos.xlsx".

BEGIN;

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS codigo_vulpes VARCHAR(60),
  ADD COLUMN IF NOT EXISTS disponibilidad VARCHAR(40),
  ADD COLUMN IF NOT EXISTS tipo_empaque VARCHAR(80),
  ADD COLUMN IF NOT EXISTS presentacion VARCHAR(160),
  ADD COLUMN IF NOT EXISTS unidad_venta VARCHAR(30) NOT NULL DEFAULT 'CAJA',
  ADD COLUMN IF NOT EXISTS en_catalogo_precios BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS productos_codigo_vulpes_uniq
  ON productos (codigo_vulpes)
  WHERE codigo_vulpes IS NOT NULL AND codigo_vulpes <> '';

CREATE TABLE IF NOT EXISTS listas_precios (
  id BIGSERIAL PRIMARY KEY,
  clave VARCHAR(40) UNIQUE NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  vigencia DATE NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS producto_precios (
  id BIGSERIAL PRIMARY KEY,
  producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  lista_id BIGINT NOT NULL REFERENCES listas_precios(id) ON DELETE CASCADE,
  modalidad VARCHAR(40) NOT NULL DEFAULT 'GENERAL',
  rango VARCHAR(120) NOT NULL,
  unidad_precio VARCHAR(30) NOT NULL DEFAULT 'CAJA',
  precio NUMERIC(14,4) NOT NULL CHECK (precio >= 0),
  orden SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (producto_id, lista_id, modalidad, rango)
);

CREATE INDEX IF NOT EXISTS producto_precios_producto_idx
  ON producto_precios (producto_id, lista_id, orden);

INSERT INTO listas_precios (clave, nombre, vigencia, activa)
VALUES
  ('MAYOREO', 'Lista de precios OXDA para clientes de mayoreo', DATE '2026-07-13', TRUE),
  ('GENERAL', 'Lista de precios general', DATE '2026-07-01', TRUE)
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  vigencia = EXCLUDED.vigencia,
  activa = EXCLUDED.activa,
  updated_at = NOW();

-- Los SKU corresponden al "Código de Producto" de PRODUCTOS VIGENTES.
-- codigo_vulpes conserva el código comercial usado en las listas de precios.
WITH catalogo (
  sku, nombre, categoria, codigo_vulpes, disponibilidad, tipo_empaque,
  presentacion, unidad_venta, kg_caja, costo_estandar, precio_general
) AS (
  VALUES
    ('102013', 'PAPA RECTA 3/8', 'PAPAS', '01WER38', 'Stock', 'CAJA CARTON', '4 bolsas 2.5 Kg', 'CAJA', 10.0, 286.40, 450.00),
    ('102341', 'PAPA RECTA 3/8 C/ COBERTURA', 'PAPAS', '01WER38CC', 'Stock', 'CAJA CARTON', '4 bolsas 2.5 Kg', 'CAJA', 10.0, 327.44, 565.00),
    ('104215', 'PAPA RECTA 3/8 C/ COB Y CASCARA', 'PAPAS', '01WER38CCC', 'Stock', 'CAJA CARTON', '4 bolsas 2.5 Kg', 'CAJA', 10.0, 338.24, 595.00),
    ('102419', 'PAPA ONDULADA 1/2.', 'PAPAS', '01WER12', 'Stock', 'CAJA CARTON', '4 bolsas 2.5 Kg', 'CAJA', 10.0, 286.40, 519.00),
    ('114054', 'PAPA GAJO SAZONADO', 'PAPAS', '01WERGAJO', 'Stock', 'CAJA CARTON', '4 bolsas 2.5 Kg', 'CAJA', 10.0, 359.84, 570.00),
    ('102310', 'PAPA DELGADA 1/4 C/ COBERTURA', 'PAPAS', '01WER14CC', 'Stock', 'CAJA CARTON', '4 bolsas 2.5 Kg', 'CAJA', 10.0, 338.24, 555.00),
    ('102211', '102211 - PAPA DELGADA 1/4', 'PAPAS', '01WER14', 'Stock', 'CAJA CARTON', '4 bolsas 2.5 Kg', 'CAJA', 10.0, 290.72, 498.00),
    ('505015', 'FROZEN STRAIGHT CUT 3/8', 'PAPAS', '505015', 'Stock', 'CAJA CARTON', '6 bolsas 2 Kg', 'CAJA', 12.0, 298.63, 0.00),
    ('505016', 'FROZEN STRAIGHT CUT 1/4', 'PAPAS', '505016', 'Sin asignar', 'CAJA CARTON', '', 'CAJA', 12.0, 0.00, 0.00),
    ('806982', 'AROS DE CEBOLLA', 'RETAIL', '01AVKARO', 'Consolidado', 'CAJA CARTON', '6 bolsas 1 Kg', 'CAJA', 6.0, 370.59, 510.00),
    ('805411', 'AVIKO PAPAS FRITAS ZIGZAG', 'RETAIL', '01AVKRZIG', 'Consolidado', 'CAJA CARTON', '12 bolsas de 750 gr', 'CAJA', 9.0, 354.77, 515.00),
    ('807329', 'PAPA RECTA 3/8 ORIGINAL 450 Grs', 'RETAIL', 'R01AV38450', 'Consolidado', 'CAJA CARTON', '20 bolsas 450 gr', 'CAJA', 9.0, 0.00, 515.00),
    ('807679', 'PAPA GAJO SAZONADO 500 Grs', 'RETAIL', 'R01AVGAJO', 'Consolidado', 'CAJA CARTON', '20 bolsas 500 gr', 'CAJA', 10.0, 428.05, 600.00),
    ('807769', 'PAPA CORTE RECTO 1 KILO 1000 GRS', 'RETAIL', 'R01AVKR1KG', 'Consolidado', 'CAJA CARTON', '10 bolsas 1 Kg', 'CAJA', 10.0, 382.47, 530.00),
    ('R06CAMP06', 'MANGO CON CHAMOY 226GRS', 'RETAIL', 'R06CAMP06', 'Stock', 'CAJA CARTON', '24 piezas 226 gr', 'CAJA', 5.4, 0.00, 0.00),
    ('R06CAMPFCC', 'FRESA CONGELADA CON CREMA 283G (CJ DE 24 PZ)', 'RETAIL', 'R06CAMPFCC', 'Stock', 'CAJA CARTON', '24 piezas 283 gr', 'CAJA', 6.8, 0.00, 0.00),
    ('R06CAMP09', 'MANGO PURE-PAK 226GRS', 'RETAIL', 'R06CAMP09', 'Sin asignar', 'CAJA CARTON', '24 piezas 226 gr', 'CAJA', 5.4, 0.00, 0.00),
    ('04JAL01', 'NUGGET DINO PREMIUM 10 KG', 'AVES', '04JAL01', 'Stock', 'CAJA CARTON', 'Caja con 10 Kg', 'CAJA', 10.0, 0.00, 0.00),
    ('04JAL02', 'NUGGET OVALADO PREMIUM 10 KG', 'AVES', '04JAL02', 'Stock', 'CAJA CARTON', 'Caja con 10 Kg', 'CAJA', 10.0, 0.00, 0.00),
    ('04CMAR06', 'NUGGET EMPANIZADO FR', 'AVES', '04CMAR06', 'Stock', 'CAJA CARTON', 'Caja con 4 bolsas de 2.5 Kg', 'CAJA', 10.0, 0.00, 0.00),
    ('04CMAR07', 'BONELESS NATURAL FRESKECITO', 'AVES', '04CMAR07', 'Stock', 'CAJA CARTON', 'Caja con 4 bolsas de 2.5 Kg', 'CAJA', 10.0, 0.00, 0.00)
)
INSERT INTO productos (
  sku, nombre, tipo, unidad_id, costo_estandar, activo, categoria, kg_caja,
  precio_venta, codigo_vulpes, disponibilidad, tipo_empaque, presentacion,
  unidad_venta, en_catalogo_precios, updated_at
)
SELECT
  c.sku, c.nombre, 'terminado', um.id, c.costo_estandar, TRUE, c.categoria,
  c.kg_caja, c.precio_general, c.codigo_vulpes, c.disponibilidad,
  c.tipo_empaque, c.presentacion, c.unidad_venta, TRUE, NOW()
FROM catalogo c
JOIN unidades_medida um ON um.clave = 'kg'
ON CONFLICT (sku) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo = EXCLUDED.tipo,
  costo_estandar = EXCLUDED.costo_estandar,
  activo = EXCLUDED.activo,
  categoria = EXCLUDED.categoria,
  kg_caja = EXCLUDED.kg_caja,
  precio_venta = EXCLUDED.precio_venta,
  codigo_vulpes = EXCLUDED.codigo_vulpes,
  disponibilidad = EXCLUDED.disponibilidad,
  tipo_empaque = EXCLUDED.tipo_empaque,
  presentacion = EXCLUDED.presentacion,
  unidad_venta = EXCLUDED.unidad_venta,
  en_catalogo_precios = EXCLUDED.en_catalogo_precios,
  updated_at = NOW();

-- Mayoreo: papas y retail con las cinco bandas de logística y dos de recolección.
WITH matriz (sku, p1, p2, p3, p4, p5, r1, r2) AS (
  VALUES
    ('102013', 406, 450, 425, 399, 370, 390, 350),
    ('102341', 455, 430, 535, 505, 460, 445, 430),
    ('104215', 460, 595, 565, 535, 455, 450, 440),
    ('102419', 416, 519, 489, 459, 425, 400, 390),
    ('114054', 486, 570, 535, 505, 475, 470, 455),
    ('102310', 483, 555, 530, 434.7, 480, 480, 460),
    ('102211', 414, 498, 465, 435, 400, 400, 390),
    ('806982', 453, 510, 495, 480, 465, 450, 440),
    ('805411', 445, 515, 500, 485, 470, 440, 435),
    ('807329', 445, 515, 500, 485, 470, 440, 435),
    ('807679', 532, 600, 585, 570, 555, 525, 517),
    ('807769', 490, 530, 515, 500, 485, 480, 460)
), filas AS (
  SELECT sku, t.*
  FROM matriz
  CROSS JOIN LATERAL (
    VALUES
      ('LOGISTICA', '> 60 cajas', 'CAJA', p1, 1),
      ('LOGISTICA', '6 a 10 cajas', 'CAJA', p2, 2),
      ('LOGISTICA', '11 a 49 cajas', 'CAJA', p3, 3),
      ('LOGISTICA', '50 a 80 cajas', 'CAJA', p4, 4),
      ('LOGISTICA', '> 81 cajas', 'CAJA', p5, 5),
      ('RECOLECCION', '1 a 15 cajas', 'CAJA', r1, 6),
      ('RECOLECCION', '> 16 cajas', 'CAJA', r2, 7)
  ) AS t(modalidad, rango, unidad_precio, precio, orden)
)
INSERT INTO producto_precios (producto_id, lista_id, modalidad, rango, unidad_precio, precio, orden)
SELECT p.id, l.id, f.modalidad, f.rango, f.unidad_precio, f.precio, f.orden
FROM filas f
JOIN productos p ON p.sku = f.sku
JOIN listas_precios l ON l.clave = 'MAYOREO'
ON CONFLICT (producto_id, lista_id, modalidad, rango) DO UPDATE SET
  unidad_precio = EXCLUDED.unidad_precio,
  precio = EXCLUDED.precio,
  orden = EXCLUDED.orden,
  updated_at = NOW();

-- Mayoreo: productos 505015/505016 (la primera banda es distinta en el archivo).
-- 505016 está vigente pero sin precio publicado; queda en cero para poder editarlo.
WITH matriz (sku, p1, p2, p3, p4, p5, r1, r2) AS (
  VALUES
    ('505015', 354.00, 366.00, 354.00, 342.00, 335.00, 384.00, 333.60),
    ('505016', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00)
), filas AS (
  SELECT sku, t.*
  FROM matriz
  CROSS JOIN LATERAL (
    VALUES
      ('LOGISTICA', '> 25 cajas', 'CAJA', p1, 1),
      ('LOGISTICA', '6 a 10 cajas', 'CAJA', p2, 2),
      ('LOGISTICA', '11 a 49 cajas', 'CAJA', p3, 3),
      ('LOGISTICA', '50 a 80 cajas', 'CAJA', p4, 4),
      ('LOGISTICA', '> 81 cajas', 'CAJA', p5, 5),
      ('RECOLECCION', '1 a 15 cajas', 'CAJA', r1, 6),
      ('RECOLECCION', '> 16 cajas', 'CAJA', r2, 7)
  ) AS t(modalidad, rango, unidad_precio, precio, orden)
)
INSERT INTO producto_precios (producto_id, lista_id, modalidad, rango, unidad_precio, precio, orden)
SELECT p.id, l.id, f.modalidad, f.rango, f.unidad_precio, f.precio, f.orden
FROM filas f
JOIN productos p ON p.sku = f.sku
JOIN listas_precios l ON l.clave = 'MAYOREO'
ON CONFLICT (producto_id, lista_id, modalidad, rango) DO UPDATE SET
  unidad_precio = EXCLUDED.unidad_precio,
  precio = EXCLUDED.precio,
  orden = EXCLUDED.orden,
  updated_at = NOW();

-- Guardado atómico desde la API. Si falla cualquier precio, no se guarda
-- parcialmente la ficha del producto.
CREATE OR REPLACE FUNCTION public.guardar_producto_catalogo(
  p_sku TEXT,
  p_producto JSONB,
  p_precios JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_producto_id BIGINT;
  v_esperados INTEGER;
  v_actualizados INTEGER;
  v_precio_general NUMERIC(14,4);
BEGIN
  IF jsonb_typeof(COALESCE(p_precios, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'p_precios debe ser un arreglo JSON';
  END IF;

  UPDATE public.productos
  SET
    nombre = NULLIF(BTRIM(p_producto ->> 'product'), ''),
    categoria = NULLIF(BTRIM(p_producto ->> 'category'), ''),
    codigo_vulpes = NULLIF(BTRIM(p_producto ->> 'vulpesCode'), ''),
    disponibilidad = NULLIF(BTRIM(p_producto ->> 'availability'), ''),
    tipo_empaque = NULLIF(BTRIM(p_producto ->> 'packageType'), ''),
    presentacion = NULLIF(BTRIM(p_producto ->> 'presentation'), ''),
    unidad_venta = COALESCE(NULLIF(BTRIM(p_producto ->> 'salesUnit'), ''), 'CAJA'),
    kg_caja = (p_producto ->> 'kgBox')::NUMERIC,
    costo_estandar = (p_producto ->> 'costBox')::NUMERIC,
    activo = COALESCE((p_producto ->> 'active')::BOOLEAN, TRUE),
    updated_at = NOW()
  WHERE sku = p_sku
    AND en_catalogo_precios = TRUE
  RETURNING id INTO v_producto_id;

  IF v_producto_id IS NULL THEN
    RAISE EXCEPTION 'Producto % no encontrado en el catálogo de precios', p_sku;
  END IF;

  SELECT COUNT(*)
  INTO v_esperados
  FROM jsonb_array_elements(COALESCE(p_precios, '[]'::jsonb));

  WITH precios_entrada AS (
    SELECT
      (elemento ->> 'id')::BIGINT AS id,
      (elemento ->> 'price')::NUMERIC AS precio
    FROM jsonb_array_elements(COALESCE(p_precios, '[]'::jsonb)) AS entrada(elemento)
  )
  UPDATE public.producto_precios AS destino
  SET
    precio = entrada.precio,
    updated_at = NOW()
  FROM precios_entrada AS entrada
  WHERE destino.id = entrada.id
    AND destino.producto_id = v_producto_id;

  GET DIAGNOSTICS v_actualizados = ROW_COUNT;

  IF v_actualizados <> v_esperados THEN
    RAISE EXCEPTION 'Uno o más precios no pertenecen al producto %', p_sku;
  END IF;

  SELECT pp.precio
  INTO v_precio_general
  FROM public.producto_precios pp
  JOIN public.listas_precios lp ON lp.id = pp.lista_id
  WHERE pp.producto_id = v_producto_id
    AND lp.clave = 'GENERAL'
  ORDER BY pp.orden, pp.id
  LIMIT 1;

  IF v_precio_general IS NOT NULL THEN
    UPDATE public.productos
    SET precio_venta = v_precio_general
    WHERE id = v_producto_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'code', p_sku,
    'updatedPrices', v_actualizados
  );
END;
$$;

-- Las tablas están en public porque la API REST de Supabase las consulta,
-- pero no quedan expuestas a clientes web. Sólo el backend usa service_role.
ALTER TABLE public.listas_precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_precios ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.listas_precios FROM anon, authenticated;
REVOKE ALL ON TABLE public.producto_precios FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.listas_precios_id_seq FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.producto_precios_id_seq FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.guardar_producto_catalogo(TEXT, JSONB, JSONB) FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.listas_precios TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.producto_precios TO service_role;
GRANT SELECT, UPDATE ON TABLE public.productos TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.listas_precios_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.producto_precios_id_seq TO service_role;
GRANT EXECUTE ON FUNCTION public.guardar_producto_catalogo(TEXT, JSONB, JSONB) TO service_role;

-- Mayoreo: productos preparados con un solo precio por caja.
WITH filas (sku, precio) AS (
  VALUES
    ('R06CAMP06', 350.00),
    ('R06CAMPFCC', 405.00),
    ('R06CAMP09', 0.00)
)
INSERT INTO producto_precios (producto_id, lista_id, modalidad, rango, unidad_precio, precio, orden)
SELECT p.id, l.id, 'LOGISTICA', 'Precio por caja', 'CAJA', f.precio, 1
FROM filas f
JOIN productos p ON p.sku = f.sku
JOIN listas_precios l ON l.clave = 'MAYOREO'
ON CONFLICT (producto_id, lista_id, modalidad, rango) DO UPDATE SET
  unidad_precio = EXCLUDED.unidad_precio,
  precio = EXCLUDED.precio,
  orden = EXCLUDED.orden,
  updated_at = NOW();

-- Mayoreo: aves, con cuatro bandas de logística y dos de recolección.
WITH matriz (sku, p1, p2, p3, p4, r1, r2) AS (
  VALUES
    ('04JAL01', 950, 900, 850, 785, 900, 875),
    ('04JAL02', 920, 890, 840, 785, 890, 875),
    ('04CMAR06', 750, 700, 650, 599, 700, 660),
    ('04CMAR07', 1450, 1390, 1300, 1145, 1390, 1350)
), filas AS (
  SELECT sku, t.*
  FROM matriz
  CROSS JOIN LATERAL (
    VALUES
      ('LOGISTICA', '1 a 5 cajas', 'CAJA', p1, 1),
      ('LOGISTICA', '6 a 13 cajas', 'CAJA', p2, 2),
      ('LOGISTICA', '14 a 20 cajas', 'KG', p3, 3),
      ('LOGISTICA', '> 21 cajas', 'KG', p4, 4),
      ('RECOLECCION', '1 a 10 cajas', 'CAJA', r1, 5),
      ('RECOLECCION', '> 11 cajas', 'CAJA', r2, 6)
  ) AS t(modalidad, rango, unidad_precio, precio, orden)
)
INSERT INTO producto_precios (producto_id, lista_id, modalidad, rango, unidad_precio, precio, orden)
SELECT p.id, l.id, f.modalidad, f.rango, f.unidad_precio, f.precio, f.orden
FROM filas f
JOIN productos p ON p.sku = f.sku
JOIN listas_precios l ON l.clave = 'MAYOREO'
ON CONFLICT (producto_id, lista_id, modalidad, rango) DO UPDATE SET
  unidad_precio = EXCLUDED.unidad_precio,
  precio = EXCLUDED.precio,
  orden = EXCLUDED.orden,
  updated_at = NOW();

-- Lista general: precio por caja para pedidos mayores a 11 cajas.
WITH filas (sku, precio) AS (
  VALUES
    ('102013', 450.00),
    ('102341', 565.00),
    ('104215', 595.00),
    ('102419', 519.00),
    ('114054', 570.00),
    ('102310', 555.00),
    ('102211', 498.00),
    ('806982', 510.00),
    ('805411', 515.00),
    ('807329', 515.00),
    ('807679', 600.00),
    ('807769', 530.00),
    ('505015', 0.00),
    ('505016', 0.00),
    ('R06CAMP06', 0.00),
    ('R06CAMPFCC', 0.00),
    ('R06CAMP09', 0.00),
    ('04JAL01', 0.00),
    ('04JAL02', 0.00),
    ('04CMAR06', 0.00),
    ('04CMAR07', 0.00)
)
INSERT INTO producto_precios (producto_id, lista_id, modalidad, rango, unidad_precio, precio, orden)
SELECT p.id, l.id, 'GENERAL', '> 11 cajas', 'CAJA', f.precio, 1
FROM filas f
JOIN productos p ON p.sku = f.sku
JOIN listas_precios l ON l.clave = 'GENERAL'
ON CONFLICT (producto_id, lista_id, modalidad, rango) DO UPDATE SET
  unidad_precio = EXCLUDED.unidad_precio,
  precio = EXCLUDED.precio,
  orden = EXCLUDED.orden,
  updated_at = NOW();

COMMIT;
