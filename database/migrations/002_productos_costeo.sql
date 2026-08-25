-- Agrega campos de costeo a productos y carga el catálogo inicial de lista de precios

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS categoria VARCHAR(60),
  ADD COLUMN IF NOT EXISTS kg_caja NUMERIC(10,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precio_venta NUMERIC(14,4) NOT NULL DEFAULT 0;

INSERT INTO productos (sku, nombre, tipo, unidad_id, costo_estandar, kg_caja, precio_venta, categoria)
SELECT data.sku, data.nombre, data.tipo, um.id, data.costo_estandar, data.kg_caja, data.precio_venta, data.categoria
FROM (
  VALUES
    ('105632', '10 MM NATURAL WERISNG', 'terminado', 'kg', 276, 10, 355, 'PAPA'),
    ('102341', '10 MM CON COBERTURA', 'terminado', 'kg', 307, 10, 410, 'PAPA'),
    ('114054', 'GAJOS SAZONADOS', 'terminado', 'kg', 325, 10, 465, 'PAPA'),
    ('260612', 'CASTEL STRAIGHT CUT', 'terminado', 'kg', 250, 10, 310, 'PAPA'),
    ('505015', 'FROZEN STRAIGHT CUT KAIDA', 'terminado', 'kg', 348, 12, 440, 'PAPA'),
    ('806982', 'AROS DE CEBOLLA AVIKO', 'terminado', 'kg', 334, 6, 510, 'SECOS'),
    ('807329', 'AVIKO ORIGINAL 20X450G', 'terminado', 'kg', 290, 9, 385, 'PAPA')
) AS data(sku, nombre, tipo, unidad_clave, costo_estandar, kg_caja, precio_venta, categoria)
JOIN unidades_medida um ON um.clave = data.unidad_clave
ON CONFLICT (sku) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  costo_estandar = EXCLUDED.costo_estandar,
  kg_caja = EXCLUDED.kg_caja,
  precio_venta = EXCLUDED.precio_venta,
  categoria = EXCLUDED.categoria;
