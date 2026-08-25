INSERT INTO areas (clave, nombre) VALUES ('PROD', 'Producción') ON CONFLICT (clave) DO NOTHING;
INSERT INTO unidades_medida (clave, nombre) VALUES ('kg', 'Kilogramo') ON CONFLICT (clave) DO NOTHING;
INSERT INTO usuarios (nombre, email, password_hash, area_id)
SELECT 'Administrador', 'admin@oxda.local', 'managed-by-supabase-auth', id FROM areas WHERE clave = 'PROD'
ON CONFLICT (email) DO NOTHING;
INSERT INTO clientes (nombre_comercial) VALUES ('Cliente general') ON CONFLICT DO NOTHING;
INSERT INTO almacenes (clave, nombre, tipo) VALUES ('GENERAL', 'Almacén general', 'terminado') ON CONFLICT (clave) DO NOTHING;
INSERT INTO productos (sku, nombre, tipo, unidad_id)
SELECT 'PROD-001', 'Producto general', 'terminado', id FROM unidades_medida WHERE clave = 'kg'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO lotes (codigo, producto_id)
SELECT 'LOTE-001', id FROM productos WHERE sku = 'PROD-001'
ON CONFLICT (codigo) DO NOTHING;
INSERT INTO produccion_planes (fecha, turno, area_id, meta_kg, supervisor_id)
SELECT CURRENT_DATE, 'matutino', a.id, 0, u.id FROM areas a CROSS JOIN usuarios u WHERE a.clave = 'PROD' AND u.email = 'admin@oxda.local'
ON CONFLICT DO NOTHING;
INSERT INTO produccion_ordenes (plan_id, lote_id, producto_id, objetivo_kg)
SELECT pp.id, l.id, p.id, 0 FROM produccion_planes pp CROSS JOIN lotes l CROSS JOIN productos p WHERE l.codigo = 'LOTE-001' AND p.sku = 'PROD-001'
ON CONFLICT DO NOTHING;
INSERT INTO logistica_rutas (clave, nombre) VALUES ('RUTA-001', 'Ruta general') ON CONFLICT (clave) DO NOTHING;
INSERT INTO logistica_unidades (placa, tipo) VALUES ('OXDA-001', 'Unidad general') ON CONFLICT (placa) DO NOTHING;
