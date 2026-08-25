-- Ejecuta después de 020_crm_producto_interes_catalogo.sql.

SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'crm_prospectos'
      AND column_name = 'producto_interes_id'
  ) AS crm_tiene_producto_interes_id,
  EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'crm_prospectos_producto_interes_id_fkey'
  ) AS crm_producto_interes_tiene_llave_foranea;

SELECT
  COUNT(*) FILTER (WHERE producto_interes_id IS NOT NULL) AS prospectos_vinculados,
  COUNT(*) FILTER (WHERE producto_interes IS NOT NULL AND producto_interes_id IS NULL) AS prospectos_legacy_sin_vinculo
FROM public.crm_prospectos;
