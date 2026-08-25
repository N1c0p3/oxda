-- Ejecuta después de 019_modelo_costeo_importacion.sql.

SELECT
  COUNT(*) FILTER (WHERE p.en_catalogo_precios) =
    COUNT(pc.producto_id) FILTER (WHERE p.en_catalogo_precios) AS todos_los_productos_tienen_costeo,
  COUNT(pc.producto_id) FILTER (WHERE p.en_catalogo_precios) AS productos_con_costeo
FROM public.productos p
LEFT JOIN public.producto_costeos pc ON pc.producto_id = p.id;

WITH excel AS (
  SELECT
    p.kg_caja,
    pc.*,
    pc.cajas_por_tarima * pc.tarimas_por_contenedor AS cajas_contenedor
  FROM public.producto_costeos pc
  JOIN public.productos p ON p.id = pc.producto_id
  WHERE p.sku = '102013'
), calculo AS (
  SELECT
    *,
    (kg_caja * precio_origen_kg + flete_maritimo / cajas_contenedor)
      * (tipo_cambio_base * factor_tipo_cambio) AS costo_origen_convertido
  FROM excel
)
SELECT
  ABS(cajas_contenedor - 2376) < 0.0001 AS cajas_excel_correctas,
  ABS(kg_caja * cajas_contenedor - 23760) < 0.0001 AS kg_excel_correctos,
  ABS(costo_origen_convertido - 207.8573686869) < 0.0001 AS costo_origen_correcto,
  ABS(
    costo_origen_convertido
    + costo_origen_convertido * tasa_interes_impuestos
    + gastos_aduanales / cajas_contenedor
    + flete_aduana_cliente / cajas_contenedor
    + almacenaje_caja
    - 281.8617735337
  ) < 0.0001 AS costo_caja_correcto,
  ABS((
    costo_origen_convertido
    + costo_origen_convertido * tasa_interes_impuestos
    + gastos_aduanales / cajas_contenedor
    + flete_aduana_cliente / cajas_contenedor
    + almacenaje_caja
  ) / (1 - margen_objetivo) - 323.9790500387) < 0.0001 AS precio_caja_correcto
FROM calculo;

SELECT
  relrowsecurity AS rls_habilitado
FROM pg_class
WHERE oid = 'public.producto_costeos'::regclass;

SELECT has_function_privilege(
  'service_role',
  'public.guardar_producto_catalogo_costeo(text,jsonb,jsonb,jsonb)',
  'EXECUTE'
) AS backend_puede_guardar_costeo;
