-- Ejecuta este archivo después de 017_catalogo_listas_precios.sql.
-- Todas las comprobaciones deben devolver TRUE y cero incidencias.

SELECT
  COUNT(*) = 21 AS catalogo_tiene_21_productos,
  COUNT(*) FILTER (WHERE activo) AS productos_activos,
  COUNT(*) FILTER (WHERE codigo_vulpes IS NULL OR codigo_vulpes = '') AS sin_codigo_vulpes
FROM public.productos
WHERE en_catalogo_precios = TRUE;

SELECT
  COUNT(*) = 2 AS existen_dos_listas,
  STRING_AGG(clave, ', ' ORDER BY clave) AS listas
FROM public.listas_precios
WHERE activa = TRUE;

SELECT
  COUNT(*) = 146 AS existen_146_precios_ligados,
  COUNT(DISTINCT producto_id) = 21 AS los_21_productos_tienen_precios
FROM public.producto_precios;

SELECT
  p.sku,
  p.nombre,
  COUNT(pp.id) AS precios_ligados
FROM public.productos p
LEFT JOIN public.producto_precios pp ON pp.producto_id = p.id
WHERE p.en_catalogo_precios = TRUE
GROUP BY p.id, p.sku, p.nombre
HAVING COUNT(pp.id) = 0
ORDER BY p.sku;

SELECT
  producto_id,
  lista_id,
  modalidad,
  rango,
  COUNT(*) AS duplicados
FROM public.producto_precios
GROUP BY producto_id, lista_id, modalidad, rango
HAVING COUNT(*) > 1;

SELECT
  relname AS tabla,
  relrowsecurity AS rls_habilitado
FROM pg_class
WHERE oid IN ('public.listas_precios'::regclass, 'public.producto_precios'::regclass)
ORDER BY relname;

SELECT
  NOT has_table_privilege('anon', 'public.listas_precios', 'SELECT')
    AND NOT has_table_privilege('authenticated', 'public.listas_precios', 'SELECT')
    AS listas_cerradas_al_cliente,
  NOT has_table_privilege('anon', 'public.producto_precios', 'SELECT')
    AND NOT has_table_privilege('authenticated', 'public.producto_precios', 'SELECT')
    AS precios_cerrados_al_cliente,
  has_function_privilege(
    'service_role',
    'public.guardar_producto_catalogo(text,jsonb,jsonb)',
    'EXECUTE'
  ) AS backend_puede_guardar;
